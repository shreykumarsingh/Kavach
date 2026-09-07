"""
Kavach AI Deepfake Detection Service  ·  v4.0  (Production)
=============================================================
Detection Pipeline (in priority order):
  1. LOCAL Transformers model  — prithivMLmods/deepfake-detector-model-v1
  2. HuggingFace Inference API — multiple specialist models
  3. Local forensic heuristics  — EXIF / ELA / noise / entropy / GAN-fingerprint
  4. Face matching              — DeepFace (ArcFace) or perceptual-hash fallback
  5. Video analysis             — frame-sampled detection

Verdict: ONE of:
  "Content Appears Authentic"
  "AI Generated / Deepfake Detected"
  "Face Not Matching with Registered User"
"""

from __future__ import annotations
import os, io, json, hashlib, base64, tempfile, traceback, time
from pathlib import Path
from typing import Optional, List, Tuple

from dotenv import load_dotenv
load_dotenv()

import numpy as np
import httpx
import imagehash
from PIL import Image, ExifTags
from fastapi import FastAPI, File, UploadFile, Form, Request
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from scipy.ndimage import gaussian_filter
from scipy.stats import entropy as scipy_entropy

# ── Optional heavy deps (gracefully degraded) ────────────────────────────────
try:
    import torch
    from transformers import pipeline as hf_pipeline
    _TORCH_OK = True
except ImportError:
    _TORCH_OK = False
    print("[startup] torch/transformers not available — using HF API + heuristics", flush=True)

try:
    import cv2
    _CV2_OK = True
except ImportError:
    _CV2_OK = False
    print("[startup] opencv not available — video analysis disabled", flush=True)

try:
    from deepface import DeepFace
    _DEEPFACE_OK = True
    print("[startup] ✅ DeepFace loaded", flush=True)
except Exception as _e:
    _DEEPFACE_OK = False
    print(f"[startup] DeepFace not available: {_e}", flush=True)

# ─────────────────────────────────────────────────────────────────────────────
# Load local deepfake classifier at startup
# ─────────────────────────────────────────────────────────────────────────────
_LOCAL_MODEL   = None
_MODEL_NAME    = "prithivMLmods/deepfake-detector-model-v1"

if _TORCH_OK:
    try:
        _device = 0 if torch.cuda.is_available() else -1
        print(f"[startup] Loading {_MODEL_NAME} on {'GPU' if _device==0 else 'CPU'}…", flush=True)
        _LOCAL_MODEL = hf_pipeline(
            "image-classification",
            model=_MODEL_NAME,
            device=_device,
        )
        print("[startup] ✅ Local model loaded", flush=True)
    except Exception as _e:
        print(f"[startup] ⚠ Model load failed: {_e} — using API + heuristics", flush=True)

# ─────────────────────────────────────────────────────────────────────────────
# FastAPI app
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(title="Kavach Deepfake Detection v4")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads"); UPLOAD_DIR.mkdir(exist_ok=True)
REPORTS_DIR = Path("reports"); REPORTS_DIR.mkdir(exist_ok=True)

# Thresholds
DEEPFAKE_THRESHOLD   = 52   # fake_score > 52 → deepfake
FACE_MATCH_THRESHOLD = 68   # similarity % above this = match
PARTIAL_MATCH_THRESHOLD = 45

# Label sets used by HF models
_FAKE_LABELS = {"deepfake","fake","artificial","ai-generated","ai_generated","forged","manipulated"}
_REAL_LABELS = {"real","human","authentic","genuine","natural","original"}


# ══════════════════════════════════════════════════════════════════════════════
# LAYER 1 — Local transformers model
# ══════════════════════════════════════════════════════════════════════════════
def run_local_model(contents: bytes) -> Optional[float]:
    """Returns fake_score 0-100 or None."""
    if _LOCAL_MODEL is None:
        return None
    try:
        img = Image.open(io.BytesIO(contents)).convert("RGB")
        results = _LOCAL_MODEL(img)
        print(f"[L1-LocalModel] {results}", flush=True)
        for item in results:
            lbl = item["label"].lower().strip()
            sc  = float(item["score"])
            if lbl in _FAKE_LABELS:
                return round(sc * 100, 2)
            if lbl in _REAL_LABELS:
                return round((1.0 - sc) * 100, 2)
        best = max(results, key=lambda x: x["score"])
        return round(float(best["score"]) * 100, 2)
    except Exception as e:
        print(f"[L1-LocalModel] error: {e}", flush=True)
        return None


# ══════════════════════════════════════════════════════════════════════════════
# LAYER 2 — HuggingFace Inference API (multi-model ensemble)
# ══════════════════════════════════════════════════════════════════════════════
_HF_MODELS = [
    {
        "url":         "https://api-inference.huggingface.co/models/prithivMLmods/deepfake-detector-model-v1",
        "fake_labels": ["deepfake","fake","artificial","ai-generated","ai_generated"],
        "real_labels": ["real","human","authentic"],
        "weight":      1.0,
    },
    {
        "url":         "https://api-inference.huggingface.co/models/umm-maybe/AI-image-detector",
        "fake_labels": ["artificial","ai-generated","fake","ai_generated"],
        "real_labels": ["human","real","authentic"],
        "weight":      0.85,
    },
    {
        "url":         "https://api-inference.huggingface.co/models/Organika/sdxl-detector",
        "fake_labels": ["artificial","ai-generated","fake","sdxl","ai_generated"],
        "real_labels": ["human","real","authentic"],
        "weight":      0.75,
    },
    {
        "url":         "https://api-inference.huggingface.co/models/haithemhermessi/deepfake-detection",
        "fake_labels": ["deepfake","fake","artificial"],
        "real_labels": ["real","genuine"],
        "weight":      0.90,
    },
]

async def run_hf_api_ensemble(contents: bytes) -> Optional[float]:
    """
    Call multiple HF Inference API models and return a weighted average
    fake_score (0-100), or None if all unavailable.
    """
    hf_key = os.environ.get("HF_API_KEY", "")
    auth   = {"Authorization": f"Bearer {hf_key}"} if hf_key else {}

    try:
        img_tmp = Image.open(io.BytesIO(contents))
        if img_tmp.mode != "RGB":
            img_tmp = img_tmp.convert("RGB")
        buf = io.BytesIO(); img_tmp.save(buf, format="JPEG", quality=92)
        jpeg_bytes = buf.getvalue()
    except Exception:
        jpeg_bytes = contents

    scores: List[Tuple[float, float]] = []   # (score, weight)

    for cfg in _HF_MODELS:
        name = cfg["url"].split("/")[-1]
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    cfg["url"],
                    headers={**auth, "Content-Type": "image/jpeg"},
                    content=jpeg_bytes,
                )
            if resp.status_code == 200:
                data = resp.json()
                print(f"[L2-HF {name}] {data}", flush=True)
                if isinstance(data, list) and data:
                    score_map = {
                        item["label"].lower().strip(): float(item["score"])
                        for item in data if "label" in item
                    }
                    got = False
                    for lbl in cfg["fake_labels"]:
                        if lbl in score_map:
                            scores.append((score_map[lbl] * 100, cfg["weight"]))
                            got = True; break
                    if not got:
                        for lbl in cfg["real_labels"]:
                            if lbl in score_map:
                                scores.append(((1.0 - score_map[lbl]) * 100, cfg["weight"]))
                                break
            elif resp.status_code == 503:
                print(f"[L2-HF {name}] cold-starting", flush=True)
            else:
                print(f"[L2-HF {name}] HTTP {resp.status_code}", flush=True)
        except Exception as e:
            print(f"[L2-HF {name}] error: {e}", flush=True)

    if not scores:
        return None

    total_w = sum(w for _, w in scores)
    weighted = sum(s * w for s, w in scores) / total_w
    result = round(weighted, 2)
    print(f"[L2-HF Ensemble] weighted fake_score={result}% from {len(scores)} models", flush=True)
    return result


# ══════════════════════════════════════════════════════════════════════════════
# LAYER 3 — Local forensic heuristics
# ══════════════════════════════════════════════════════════════════════════════

def _exif_signal(img: Image.Image) -> Tuple[float, str]:
    """Returns (fake_score, reason)."""
    CAMERA_TAGS = {271, 272, 36867, 37386, 33434, 33437, 34855, 37383}
    AI_SOFTWARE = ["stable diffusion","midjourney","dall-e","dall·e","firefly",
                   "generated","ai-generated","image creator","bing image"]
    try:
        exif = img._getexif()
        if exif is None:
            return 71.0, "No EXIF data — typical of AI-generated images"
        sw = str(exif.get(305, "")).lower()
        for kw in AI_SOFTWARE:
            if kw in sw:
                return 91.0, f"AI software tag detected: {exif.get(305,'')[:60]}"
        found = sum(1 for t in CAMERA_TAGS if t in exif)
        if found >= 5: return 10.0, "Rich camera EXIF — likely authentic photo"
        if found >= 3: return 28.0, "Partial camera EXIF"
        if found >= 1: return 48.0, "Minimal EXIF metadata"
        return 65.0, "No camera metadata"
    except Exception:
        return 68.0, "Could not parse EXIF"

def _ela_signal(img: Image.Image) -> Tuple[float, str]:
    """Error Level Analysis — AI images have very low ELA residuals."""
    try:
        orig = np.array(img.convert("RGB"), dtype=np.float32)
        buf  = io.BytesIO()
        img.save(buf, format="JPEG", quality=75); buf.seek(0)
        comp = np.array(Image.open(buf).convert("RGB"), dtype=np.float32)
        if comp.shape != orig.shape:
            comp = np.array(
                Image.fromarray(comp.astype(np.uint8)).resize((orig.shape[1],orig.shape[0])),
                dtype=np.float32)
        ela = float(np.mean(np.abs(orig - comp)))
        print(f"[Heuristics] ELA={ela:.3f}", flush=True)
        if ela < 1.2: return 76.0, f"Very low ELA residual ({ela:.2f}) — AI pattern"
        if ela < 2.5: return 58.0, f"Low ELA residual ({ela:.2f})"
        if ela < 6.0: return 38.0, f"Normal ELA ({ela:.2f})"
        return 22.0, f"High ELA residual ({ela:.2f}) — typical camera photo"
    except Exception:
        return 50.0, "ELA unavailable"

def _noise_signal(gray: np.ndarray) -> Tuple[float, str]:
    """Real cameras have Gaussian sensor noise std ≈ 3-12; AI renders are cleaner."""
    residual = gray - gaussian_filter(gray, sigma=1.5)
    std = float(np.std(residual))
    print(f"[Heuristics] Noise std={std:.3f}", flush=True)
    if std < 0.8:  return 90.0, f"Extremely clean (σ={std:.2f}) — AI fingerprint"
    if std < 1.5:  return 75.0, f"Very low noise (σ={std:.2f})"
    if std < 3.0:  return 52.0, f"Below-average noise (σ={std:.2f})"
    if std < 8.0:  return 25.0, f"Normal camera noise (σ={std:.2f})"
    return 35.0,   f"High noise (σ={std:.2f})"

def _entropy_signal(gray: np.ndarray) -> Tuple[float, str]:
    """AI images: uniform complexity everywhere; real photos: wild variation."""
    h, w = gray.shape
    p = max(16, min(h, w) // 16)
    ents = []
    for r in range(0, h - p, p):
        for c in range(0, w - p, p):
            patch = gray[r:r+p, c:c+p].astype(np.uint8).flatten()
            hist, _ = np.histogram(patch, bins=64, range=(0, 255))
            prob = hist / (hist.sum() + 1e-10)
            ents.append(float(scipy_entropy(prob + 1e-10)))
    if not ents: return 50.0, "Entropy unavailable"
    std = float(np.std(ents))
    print(f"[Heuristics] Entropy std={std:.3f}", flush=True)
    if std < 0.18: return 84.0, f"Very uniform entropy (σ={std:.2f}) — AI pattern"
    if std < 0.38: return 63.0, f"Low entropy variation (σ={std:.2f})"
    if std < 0.65: return 38.0, f"Normal entropy (σ={std:.2f})"
    return 20.0,   f"High entropy variation (σ={std:.2f}) — natural photo"

def _gan_fingerprint_signal(gray: np.ndarray) -> Tuple[float, str]:
    """
    GAN-generated images have characteristic frequency artifacts in FFT:
    high energy at Nyquist and grid-like spectral patterns.
    """
    try:
        rows, cols = gray.shape
        fft  = np.fft.fft2(gray.astype(np.float32))
        fshift = np.fft.fftshift(fft)
        magnitude = 20 * np.log(np.abs(fshift) + 1)
        # Normalize
        mag_norm = magnitude / (magnitude.max() + 1e-10)
        
        # High-frequency content ratio (outer 20% ring)
        cy, cx = rows // 2, cols // 2
        r_outer = min(rows, cols) // 2
        r_inner = int(r_outer * 0.8)
        Y, X = np.ogrid[:rows, :cols]
        dist = np.sqrt((Y - cy)**2 + (X - cx)**2)
        outer_mask = dist > r_inner
        inner_mask = dist <= r_inner
        
        hf_energy = float(mag_norm[outer_mask].mean())
        lf_energy = float(mag_norm[inner_mask].mean())
        ratio = hf_energy / (lf_energy + 1e-10)
        
        print(f"[Heuristics] GAN FFT ratio={ratio:.4f}", flush=True)
        
        if ratio > 0.85:  return 78.0, f"GAN-like spectral pattern (ratio={ratio:.3f})"
        if ratio > 0.70:  return 58.0, f"Elevated high-freq content (ratio={ratio:.3f})"
        if ratio > 0.55:  return 38.0, f"Normal spectral balance (ratio={ratio:.3f})"
        return 22.0, f"Natural spectral profile (ratio={ratio:.3f})"
    except Exception:
        return 50.0, "Spectral analysis unavailable"

def run_local_heuristics(contents: bytes) -> Tuple[float, List[str], dict]:
    """
    Combined forensic heuristics.
    Returns (fake_score, reasons[], metrics{}).
    Last resort — used only when all ML methods fail.
    """
    reasons:  List[str] = []
    metrics:  dict      = {}
    signals:  List[Tuple[float, float]] = []  # (score, weight)
    
    try:
        img  = Image.open(io.BytesIO(contents))
        if img.mode != "RGB":
            img = img.convert("RGB")
        gray = np.array(img.convert("L"), dtype=np.float64)

        exif_s, exif_r   = _exif_signal(img)
        ela_s,  ela_r    = _ela_signal(img)
        noise_s, noise_r = _noise_signal(gray)
        ent_s,  ent_r    = _entropy_signal(gray)
        gan_s,  gan_r    = _gan_fingerprint_signal(gray)

        signals = [
            (exif_s,  0.35),
            (ela_s,   0.20),
            (noise_s, 0.18),
            (ent_s,   0.14),
            (gan_s,   0.13),
        ]
        reasons = [exif_r, ela_r, noise_r, ent_r, gan_r]
        metrics = {
            "exif_score":    round(exif_s,  1),
            "ela_score":     round(ela_s,   1),
            "noise_score":   round(noise_s, 1),
            "entropy_score": round(ent_s,   1),
            "gan_score":     round(gan_s,   1),
        }

        total_w = sum(w for _, w in signals)
        fake_score = sum(s * w for s, w in signals) / total_w
        return round(float(np.clip(fake_score, 5.0, 95.0)), 2), reasons, metrics
    except Exception as e:
        print(f"[Heuristics] error: {e}", flush=True)
        return 50.0, ["Forensic analysis unavailable"], {}


# ══════════════════════════════════════════════════════════════════════════════
# LAYER 4 — Face Matching (DeepFace ArcFace or perceptual-hash fallback)
# ══════════════════════════════════════════════════════════════════════════════

def compute_face_match(
    ref_bytes: bytes,
    query_bytes: bytes,
) -> dict:
    """
    Compare two images for face similarity.
    Returns {
        match_label: "High Match" | "Partial Match" | "Not Matched",
        similarity:  float (0-100),
        method:      "deepface" | "phash",
        details:     str,
    }
    """
    similarity = 0.0
    method     = "phash"

    # ── Try DeepFace first ───────────────────────────────────────────────────
    if _DEEPFACE_OK:
        try:
            # Write bytes to named temp files (DeepFace needs file paths)
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f1:
                f1.write(ref_bytes); ref_path = f1.name
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f2:
                f2.write(query_bytes); query_path = f2.name

            result = DeepFace.verify(
                img1_path=ref_path,
                img2_path=query_path,
                model_name="ArcFace",
                detector_backend="retinaface",
                enforce_detection=False,
            )
            dist = float(result.get("distance", 1.0))
            # ArcFace cosine: 0 = identical, ~0.68 = threshold
            similarity = max(0.0, min(100.0, (1.0 - dist / 1.2) * 100))
            method     = "deepface"
            print(f"[FaceMatch-DeepFace] distance={dist:.4f} → sim={similarity:.1f}%", flush=True)

            # Cleanup
            for p in [ref_path, query_path]:
                try: os.unlink(p)
                except: pass

        except Exception as e:
            print(f"[FaceMatch-DeepFace] error: {e} — falling back to pHash", flush=True)

    # ── pHash fallback ───────────────────────────────────────────────────────
    if method == "phash":
        try:
            ref_img   = Image.open(io.BytesIO(ref_bytes)).convert("RGB")
            query_img = Image.open(io.BytesIO(query_bytes)).convert("RGB")
            ph_ref    = imagehash.phash(ref_img)
            ph_query  = imagehash.phash(query_img)
            hamming   = bin(int(str(ph_ref), 16) ^ int(str(ph_query), 16)).count("1")
            similarity = max(0.0, min(100.0, (64 - hamming) / 64 * 100))
            print(f"[FaceMatch-pHash] hamming={hamming} → sim={similarity:.1f}%", flush=True)
        except Exception as e:
            print(f"[FaceMatch-pHash] error: {e}", flush=True)

    # ── Classify result ──────────────────────────────────────────────────────
    if similarity >= FACE_MATCH_THRESHOLD:
        match_label = "High Match"
    elif similarity >= PARTIAL_MATCH_THRESHOLD:
        match_label = "Partial Match"
    else:
        match_label = "Not Matched"

    return {
        "match_label": match_label,
        "similarity":  round(similarity, 1),
        "method":      method,
        "details":     f"Face similarity: {similarity:.1f}% via {method.upper()}",
    }


# ══════════════════════════════════════════════════════════════════════════════
# LAYER 5 — Video frame analysis
# ══════════════════════════════════════════════════════════════════════════════

async def analyze_video(video_bytes: bytes) -> dict:
    """
    Sample N frames from video, run full pipeline on each,
    return aggregate result.
    """
    if not _CV2_OK:
        return {"fake_score": 60.0, "error": "OpenCV not available for video analysis",
                "frames_analyzed": 0, "source": "unavailable"}

    try:
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
            f.write(video_bytes); tmp_path = f.name

        cap = cv2.VideoCapture(tmp_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps          = cap.get(cv2.CAP_PROP_FPS) or 25
        duration     = total_frames / fps

        # Sample up to 12 frames spread evenly
        sample_count = min(12, max(4, total_frames // int(fps)))
        step         = max(1, total_frames // sample_count)
        frame_scores: List[float] = []

        for i in range(sample_count):
            cap.set(cv2.CAP_PROP_POS_FRAMES, i * step)
            ret, frame = cap.read()
            if not ret:
                continue
            # Convert BGR → PIL
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_frame  = Image.fromarray(frame_rgb)
            buf = io.BytesIO(); pil_frame.save(buf, format="JPEG", quality=85)
            frame_bytes = buf.getvalue()

            # Run each frame through model/API/heuristics
            fs = run_local_model(frame_bytes)
            if fs is None:
                fs = await run_hf_api_ensemble(frame_bytes)
            if fs is None:
                fs, _, _ = run_local_heuristics(frame_bytes)
            frame_scores.append(fs)

        cap.release()
        os.unlink(tmp_path)

        if not frame_scores:
            return {"fake_score": 60.0, "frames_analyzed": 0, "source": "video_sampled"}

        avg_score   = float(np.mean(frame_scores))
        max_score   = float(np.max(frame_scores))
        # Weighted: 70% average + 30% max (catches tampered frames)
        final_score = 0.70 * avg_score + 0.30 * max_score

        return {
            "fake_score":      round(final_score, 2),
            "frames_analyzed": len(frame_scores),
            "avg_frame_score": round(avg_score, 2),
            "max_frame_score": round(max_score, 2),
            "duration_seconds": round(duration, 1),
            "source": "video_sampled",
        }

    except Exception as e:
        print(f"[Video] error: {e}", flush=True)
        return {"fake_score": 60.0, "error": str(e), "frames_analyzed": 0,
                "source": "video_error"}


# ══════════════════════════════════════════════════════════════════════════════
# Master detection pipeline
# ══════════════════════════════════════════════════════════════════════════════

async def run_detection_pipeline(
    contents:              bytes,
    is_video:              bool       = False,
    fingerprint_status:    str | None = None,
    fingerprint_similarity: str | None = None,
) -> dict:
    """
    Full detection. Returns enriched result dict.
    """
    source       = "unknown"
    fake_score   = None
    forensics    = {}
    heuristic_reasons: List[str] = []

    # ── Video path ────────────────────────────────────────────────────────────
    if is_video:
        video_result = await analyze_video(contents)
        fake_score  = video_result.get("fake_score", 60.0)
        forensics["video"] = video_result
        source = video_result.get("source", "video_sampled")

    else:
        # ── L1: Local model ───────────────────────────────────────────────────
        fake_score = run_local_model(contents)
        if fake_score is not None:
            source = "local_model"

        # ── L2: HF API ensemble ───────────────────────────────────────────────
        if fake_score is None:
            fake_score = await run_hf_api_ensemble(contents)
            if fake_score is not None:
                source = "hf_api_ensemble"

        # ── L3: Local heuristics ──────────────────────────────────────────────
        if fake_score is None:
            fake_score, heuristic_reasons, forensics = run_local_heuristics(contents)
            source = "forensic_heuristics"
        else:
            # Even when a model runs, augment with forensics for report richness
            try:
                _, heuristic_reasons, forensics = run_local_heuristics(contents)
            except Exception:
                pass

    # ── Fingerprint-based adjustment (server-computed pHash similarity) ───────
    fp_adjustment = 0.0
    if fingerprint_status and fake_score is not None:
        try:
            fp_sim = float(fingerprint_similarity or 0)
        except ValueError:
            fp_sim = 0.0
        if fingerprint_status in ("match", "exact_match") and fp_sim >= 75:
            # A real photo from the registered user → nudge toward authentic
            fp_adjustment = -8.0
        elif fingerprint_status == "no_match" and fp_sim < 30:
            fp_adjustment = +10.0
        print(f"[Pipeline] FP adjustment: status={fingerprint_status} "
              f"sim={fp_sim:.1f} adj={fp_adjustment:+.1f}", flush=True)

    fake_score = float(np.clip(float(fake_score) + fp_adjustment, 5.0, 95.0))
    real_score = round(100.0 - fake_score, 2)
    fake_score = round(fake_score, 2)
    is_deepfake = fake_score > DEEPFAKE_THRESHOLD
    confidence  = round(max(fake_score, real_score), 2)

    print(f"[Pipeline] FINAL source={source} fake={fake_score}% "
          f"real={real_score}% deepfake={is_deepfake}", flush=True)

    return {
        "is_deepfake":         is_deepfake,
        "fake_score":          fake_score,
        "real_score":          real_score,
        "authenticity_score":  real_score,
        "confidence":          confidence,
        "source":              source,
        "heuristic_reasons":   heuristic_reasons,
        "forensics":           forensics,
    }


# ══════════════════════════════════════════════════════════════════════════════
# Verdict builder  (the ONE canonical decision)
# ══════════════════════════════════════════════════════════════════════════════

def build_verdict(
    det: dict,
    face_match: dict | None = None,
) -> dict:
    """
    Returns exactly ONE verdict string from the allowed set:
      • "Content Appears Authentic"
      • "AI Generated / Deepfake Detected"
      • "Face Not Matching with Registered User"

    Decision tree:
      1. If AI says deepfake → "AI Generated / Deepfake Detected"
      2. Else if face_match provided and Not Matched → "Face Not Matching…"
      3. Else → "Content Appears Authentic"
    """
    is_deepfake    = det.get("is_deepfake", False)
    fake_score     = det.get("fake_score",  50.0)
    real_score     = det.get("real_score",  50.0)
    confidence     = det.get("confidence",  50.0)
    face_sim       = face_match.get("similarity",   0.0) if face_match else None
    face_label     = face_match.get("match_label", None) if face_match else None
    has_face_match = face_match is not None

    # 1. Deepfake check
    if is_deepfake:
        verdict   = "AI Generated / Deepfake Detected"
        color     = "red"
        icon      = "warning"
        severity  = "high"
        reasons   = det.get("heuristic_reasons", [])
        reasons_  = [r for r in reasons if r]
        summary   = (
            f"AI analysis detected {fake_score:.1f}% probability of manipulation. "
            f"Forensic indicators suggest this image/video may be AI-generated or deepfake. "
            f"Detection confidence: {confidence:.0f}%."
        )

    # 2. Face mismatch check (only when face_match was performed)
    elif has_face_match and face_label == "Not Matched":
        verdict   = "Face Not Matching with Registered User"
        color     = "orange"
        icon      = "mismatch"
        severity  = "medium"
        reasons_  = [
            face_match.get("details", ""),
            f"AI authenticity score: {real_score:.1f}%",
        ]
        summary   = (
            f"The uploaded content does not match the registered user's face "
            f"(similarity: {face_sim:.1f}%). The AI analysis did not flag AI-manipulation, "
            f"but the identity cannot be confirmed."
        )

    # 3. Authentic
    else:
        verdict   = "Content Appears Authentic"
        color     = "green"
        icon      = "check"
        severity  = "low"
        reasons_  = [
            f"Real content probability: {real_score:.1f}%",
        ]
        if has_face_match and face_label:
            reasons_.append(f"Face match: {face_label} ({face_sim:.1f}%)")
        reasons_.extend([r for r in det.get("heuristic_reasons", []) if r])
        summary   = (
            f"Content shows {real_score:.1f}% authenticity score. "
            f"No significant AI-manipulation indicators detected. "
            f"Detection confidence: {confidence:.0f}%."
        )

    return {
        # Core verdict fields
        "verdict":             verdict,
        "color":               color,
        "icon":                icon,
        "severity":            severity,
        "summary":             summary,
        "reasons":             reasons_,

        # Scores
        "confidence_score":    confidence,
        "authenticity_score":  real_score,
        "ai_score":            fake_score,

        # Face match
        "face_match":          face_match,
        "face_match_score":    face_sim,
        "face_match_label":    face_label,

        # Detection details
        "is_deepfake":         is_deepfake,
        "detection_source":    det.get("source", "unknown"),
        "forensics":           det.get("forensics", {}),

        # Legacy compat fields
        "isDeepfake":          is_deepfake,
        "isUncertain":         False,
        "decisionState":       "deepfake_detected" if is_deepfake else "authentic",
        "prediction":          verdict,
        "key_findings":        reasons_,
        "red_flags":           reasons_ if is_deepfake else [],
        "manipulation_type":   "deepfake" if is_deepfake else "none",
    }


# ══════════════════════════════════════════════════════════════════════════════
# Helper: load + validate image
# ══════════════════════════════════════════════════════════════════════════════

def load_image(data: bytes) -> Image.Image:
    img = Image.open(io.BytesIO(data))
    if img.mode != "RGB":
        img = img.convert("RGB")
    return img

def get_file_hashes(contents: bytes) -> Tuple[str, str]:
    pHash    = str(imagehash.phash(Image.open(io.BytesIO(contents))))
    fileHash = hashlib.sha256(contents).hexdigest()
    return pHash, fileHash

def is_video_mime(mime: str) -> bool:
    return mime.lower().startswith("video/")

def get_fallback_legal_response(message: str) -> dict:
    msg_lower = message.lower()
    
    if any(k in msg_lower for k in ["deepfake", "morphed", "face swap", "ai photo", "ai video", "edited photo", "डीपफेक", "फर्जी"]):
        return {
            "response": (
                "For deepfake or AI-manipulated media published without consent:\n\n"
                "• **BNS Section 66E / IT Act 66E**: Covers violation of privacy by capturing, publishing, or transmitting images without consent. Punishment: Imprisonment up to 3 years and/or fine.\n"
                "• **BNS Section 66D / IT Act 66D**: Covers cheating by personation using computer resources.\n"
                "• **IT Act Section 67A**: Applies if the morphed content is sexually explicit (up to 7 years imprisonment).\n\n"
                "**Immediate Action Plan:**\n"
                "1. Screenshot all deepfake media and preserve post URLs / account handles.\n"
                "2. Do NOT delete evidence or chat logs.\n"
                "3. Report the post to the social media platform's trust & safety team.\n"
                "4. File an immediate complaint on the National Cybercrime Portal (cybercrime.gov.in) or call 1930."
            ),
            "bns_sections": [
                {"section": "BNS Section 66E", "title": "Violation of Privacy", "punishment": "Up to 3 years imprisonment and fine", "applicability": "Capturing or sharing private images without consent"},
                {"section": "BNS Section 66D", "title": "Cheating by Personation", "punishment": "Up to 3 years imprisonment and fine", "applicability": "Using fake media or impersonating another person"}
            ],
            "it_act_sections": [
                {"section": "IT Act Section 66E", "title": "Privacy Violation", "punishment": "Up to 3 years imprisonment & fine"},
                {"section": "IT Act Section 67A", "title": "Explicit Content", "punishment": "Up to 7 years imprisonment & fine"}
            ],
            "severity": "High",
            "emergency_warning": True
        }
    elif any(k in msg_lower for k in ["blackmail", "extort", "demand money", "threat", "pay", "ब्लैकमेल", "धमकी"]):
        return {
            "response": (
                "🚨 **URGENT LEGAL ADVICE FOR BLACKMAIL / EXTORTION:**\n\n"
                "1. **DO NOT PAY ANY MONEY**: Payment does not stop blackmailers; it leads to further demands.\n"
                "2. **Preserve All Evidence**: Take full-screen screenshots of messages, phone numbers, UPI handles, and threat demands.\n"
                "3. **Applicable Laws**:\n"
                "   - **BNS Section 308 (Extortion)**: Putting person in fear of injury in order to commit extortion.\n"
                "   - **BNS Section 66E / IT Act 66E**: Violation of privacy.\n"
                "   - **IT Act Section 67**: Publishing or transmitting obscene material.\n"
                "4. **Action Items**: Immediately call **1930** (Cybercrime Helpline) and file a complaint at **cybercrime.gov.in**."
            ),
            "bns_sections": [
                {"section": "BNS Section 308", "title": "Extortion", "punishment": "Imprisonment up to 7 years and fine", "applicability": "Demanding money or property by threat"},
                {"section": "BNS Section 66E", "title": "Privacy Violation", "punishment": "Up to 3 years imprisonment", "applicability": "Using private photos to threaten"}
            ],
            "severity": "Critical",
            "emergency_warning": True
        }
    elif any(k in msg_lower for k in ["hacked", "hack", "unauthorized access", "password", "stolen account", "हैक"]):
        return {
            "response": (
                "For unauthorized access or account hacking:\n\n"
                "• **IT Act Section 66**: Hacking and computer related offenses (up to 3 years imprisonment).\n"
                "• **IT Act Section 66C**: Identity theft and unauthorized credential usage.\n\n"
                "**Steps to Recover:**\n"
                "1. Reset passwords and revoke unknown active sessions.\n"
                "2. Enable 2-Factor Authentication (2FA).\n"
                "3. Report unauthorized login logs to platform support and file at cybercrime.gov.in."
            ),
            "it_act_sections": [
                {"section": "IT Act Section 66", "title": "Computer Related Offences", "punishment": "Up to 3 years imprisonment or fine up to 5 lakh"},
                {"section": "IT Act Section 66C", "title": "Identity Theft", "punishment": "Up to 3 years imprisonment and fine"}
            ],
            "severity": "Medium",
            "emergency_warning": False
        }
    else:
        return {
            "response": (
                "Under Indian Cyber Law (BNS 2023 & IT Act 2000):\n\n"
                "• **Privacy Rights**: Sharing private images or videos without consent is punishable under BNS Section 66E & IT Act 66E (up to 3 years imprisonment).\n"
                "• **Digital Impersonation**: Creating fake accounts or morphed profiles is illegal under BNS Section 66D.\n"
                "• **Reporting Channels**: You can report incidents anonymously at **cybercrime.gov.in** or call national helpline **1930** (24/7).\n\n"
                "Please describe your situation in more detail for specific legal assistance."
            ),
            "bns_sections": [
                {"section": "BNS Section 66E", "title": "Violation of Privacy", "punishment": "Up to 3 years imprisonment & fine"},
                {"section": "BNS Section 66D", "title": "Cheating by Personation", "punishment": "Up to 3 years imprisonment & fine"}
            ],
            "it_act_sections": [
                {"section": "IT Act Section 66E", "title": "Violation of Privacy", "punishment": "Up to 3 years imprisonment & fine"}
            ],
            "severity": "Medium",
            "emergency_warning": False
        }

async def chat_with_openrouter(messages: list, system_prompt: str) -> dict:
    user_msg = messages[-1]["content"] if messages else ""
    key = os.environ.get("OPENROUTER_API_KEY", "")
    if key:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                    json={
                        "model":      "anthropic/claude-3-haiku",
                        "max_tokens": 600,
                        "messages":   [{"role": "system", "content": system_prompt}] + messages,
                    },
                )
            if resp.status_code == 200:
                data = resp.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                if content:
                    fb = get_fallback_legal_response(user_msg)
                    fb["response"] = content
                    return fb
        except Exception as e:
            print(f"[Chatbot] OpenRouter request exception: {e}", flush=True)
    
    # Fallback to local legal knowledge base
    return get_fallback_legal_response(user_msg)


# ══════════════════════════════════════════════════════════════════════════════
# Routes
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/")
async def root():
    return {
        "status":       "ok",
        "service":      "Kavach Deepfake Detection v4",
        "model_loaded": _LOCAL_MODEL is not None,
        "deepface_ok":  _DEEPFACE_OK,
        "cv2_ok":       _CV2_OK,
    }

@app.get("/health")
async def health():
    return {
        "status":       "healthy",
        "model_loaded": _LOCAL_MODEL is not None,
        "deepface":     _DEEPFACE_OK,
        "video":        _CV2_OK,
    }

# ── Primary upload analysis endpoint ─────────────────────────────────────────
@app.post("/api/analyze")
async def analyze_image(
    file:                  UploadFile = File(...),
    referenceImage:        UploadFile = File(None),
    fingerprintStatus:     str        = Form(None),
    fingerprintSimilarity: str        = Form(None),
    fingerprintMessage:    str        = Form(None),
):
    """
    Main endpoint — accepts uploaded file + optional reference image.
    Called by Node server for every upload analysis.
    """
    t0 = time.time()
    try:
        contents  = await file.read()
        mime_type = file.content_type or "image/jpeg"
        is_video  = is_video_mime(mime_type)

        # Compute hashes (skip for video — too costly)
        pHash    = ""
        fileHash = hashlib.sha256(contents).hexdigest()
        if not is_video:
            try:
                pHash, fileHash = get_file_hashes(contents)
            except Exception:
                pass

        # ── Run AI detection pipeline ─────────────────────────────────────────
        det = await run_detection_pipeline(
            contents,
            is_video=is_video,
            fingerprint_status=fingerprintStatus,
            fingerprint_similarity=fingerprintSimilarity,
        )

        # ── Face matching (if reference provided) ─────────────────────────────
        face_match = None
        if referenceImage:
            try:
                ref_bytes  = await referenceImage.read()
                face_match = compute_face_match(ref_bytes, contents)
                print(f"[Route] Face match: {face_match}", flush=True)
            except Exception as e:
                print(f"[Route] Face match error: {e}", flush=True)

        # ── Build final verdict ───────────────────────────────────────────────
        verdict_data = build_verdict(det, face_match)

        elapsed = round(time.time() - t0, 2)
        print(f"[Route] /api/analyze done in {elapsed}s — verdict={verdict_data['verdict']}", flush=True)

        response_payload = {
            **verdict_data,
            "technicalDetails": {
                "phash":     pHash,
                "fileHash":  fileHash,
                "modelUsed": det["source"],
                "isVideo":   is_video,
                "elapsed_s": elapsed,
                "recommendation": "SUSPICIOUS" if det["is_deepfake"] else "AUTHENTIC",
                "overallTechnicalScore": det["fake_score"],
            },
            "detailMetrics": {
                "fake_score":  det["fake_score"],
                "real_score":  det["real_score"],
                "method":      det["source"],
                "forensics":   det.get("forensics", {}),
            },
            "aiScore":            det["fake_score"],
            "authenticityScore":  det["real_score"],
            "confidence":         det["confidence"],
        }

        return Response(
            content=json.dumps(response_payload),
            media_type="application/json",
        )

    except Exception as e:
        traceback.print_exc()
        return Response(
            content=json.dumps({
                "verdict":            "Content Appears Authentic",
                "is_deepfake":        False,
                "isUncertain":        True,
                "confidence":         50,
                "authenticity_score": 50,
                "error":              str(e),
            }),
            status_code=200,
            media_type="application/json",
        )


# ── Complete analysis (with dual reference upload) ────────────────────────────
@app.post("/api/complete-analysis")
async def complete_analysis(
    file:           UploadFile = File(...),
    referenceImage: UploadFile = File(None),
):
    """
    Full analysis with explicit reference photo for face matching.
    """
    try:
        contents = await file.read()
        is_video = is_video_mime(file.content_type or "image/jpeg")
        det      = await run_detection_pipeline(contents, is_video=is_video)

        face_match = None
        if referenceImage:
            ref_bytes  = await referenceImage.read()
            face_match = compute_face_match(ref_bytes, contents)

        verdict_data = build_verdict(det, face_match)

        # Derive legacy result fields for frontend compatibility
        verdict   = verdict_data["verdict"]
        risk_type = ("safe" if verdict == "Content Appears Authentic"
                     else "warning" if verdict == "Face Not Matching with Registered User"
                     else "danger")

        return Response(
            content=json.dumps({
                **verdict_data,
                "finalResult":       verdict,
                "resultType":        risk_type,
                "isMatch":           face_match["match_label"] != "Not Matched" if face_match else False,
                "matchScore":        face_match["similarity"] if face_match else 0.0,
                "isAI":              det["is_deepfake"],
                "aiConfidence":      det["confidence"],
                "authenticityScore": det["real_score"],
            }),
            media_type="application/json",
        )
    except Exception as e:
        traceback.print_exc()
        return Response(
            content=json.dumps({"result": "Error", "error": str(e)}),
            status_code=200, media_type="application/json",
        )


# ── Detect deepfake (simple endpoint) ────────────────────────────────────────
@app.post("/api/detect-deepfake")
async def detect_deepfake_endpoint(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        det      = await run_detection_pipeline(contents)
        verdict  = build_verdict(det)
        return Response(
            content=json.dumps({
                **verdict,
                "result": verdict["verdict"],
            }),
            media_type="application/json",
        )
    except Exception as e:
        return Response(
            content=json.dumps({"result": "Error", "error": str(e)}),
            status_code=200, media_type="application/json",
        )


# ── Perceptual hash ───────────────────────────────────────────────────────────
@app.post("/api/phash")
async def get_phash(file: UploadFile = File(...)):
    try:
        contents  = await file.read()
        image     = load_image(contents)
        pHash     = str(imagehash.phash(image))
        file_hash = hashlib.sha256(contents).hexdigest()
        return {"phash": pHash, "fileHash": file_hash}
    except Exception as e:
        return {"error": str(e)}


# ── Face matching standalone ──────────────────────────────────────────────────
@app.post("/api/face-match")
async def face_match_endpoint(
    reference: UploadFile = File(...),
    query:     UploadFile = File(...),
):
    """Standalone face comparison endpoint."""
    try:
        ref_bytes   = await reference.read()
        query_bytes = await query.read()
        result      = compute_face_match(ref_bytes, query_bytes)
        return result
    except Exception as e:
        return {"error": str(e), "similarity": 0.0, "match_label": "Not Matched"}


# ── Legal chatbot ─────────────────────────────────────────────────────────────
@app.post("/api/legal-chatbot")
async def legal_chatbot(request: dict):
    msg     = request.get("message", "")
    history = request.get("history", [])
    prompt  = ("You are a legal advisor specializing in Indian cyber law and women's rights. "
               "Help victims understand their legal options regarding deepfake/morphed image crimes.")
    messages = [{"role": "user", "content": m} for m in history + [msg]]
    return await chat_with_openrouter(messages, prompt)

@app.post("/api/cybercrime-detect")
async def cybercrime_detect(request: dict):
    msg     = request.get("message", "")
    history = request.get("history", [])
    prompt  = "You are a cybercrime detection assistant for the Kavach AI Media Protection Platform."
    messages = [{"role": "user", "content": m} for m in history + [msg]]
    return await chat_with_openrouter(messages, prompt)


# ── Analyze by URL ────────────────────────────────────────────────────────────
@app.post("/api/analyze-url")
async def analyze_url(request: dict):
    url = request.get("url", "")
    fp_status = request.get("fingerprintStatus")
    fp_sim    = request.get("fingerprintSimilarity")
    if not url:
        return JSONResponse({"error": "URL required"}, status_code=400)
    try:
        async with httpx.AsyncClient(timeout=30.0) as c:
            resp = await c.get(url)
        if resp.status_code != 200:
            return JSONResponse({"error": f"Could not fetch URL: HTTP {resp.status_code}"}, status_code=400)
        contents = resp.content
        det      = await run_detection_pipeline(
            contents, fingerprint_status=fp_status, fingerprint_similarity=str(fp_sim or ""))
        verdict  = build_verdict(det)
        return Response(content=json.dumps(verdict), media_type="application/json")
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
