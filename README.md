# 🛡️ KAVACH (Naari Kavach) — AI Media Protection & Rapid Response Platform

> **A Comprehensive, Secure AI-Powered Platform for College Campuses & Individuals to Detect Deepfakes, Prevent Media Misuse, File Legally-Compliant Reports, and Access Emergency & Legal Support.**

---

## 📋 Table of Contents

- [Overview & Mission](#-overview--mission)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Machine Learning & AI Deep Dive](#-machine-learning--ai-deep-dive)
- [Project Directory Structure](#-project-directory-structure)
- [Environment Configuration (`.env`)](#-environment-configuration-env)
- [How to Run Locally (Step-by-Step Guide)](#-how-to-run-locally-step-by-step-guide)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Security & Legal Compliance](#-security--legal-compliance)

---

## 🌟 Overview & Mission

**Kavach** (formerly Naari Kavach / She-Shield) is an end-to-end security platform built to protect female college students and individuals across India from digital abuse, deepfakes, morphed imagery, and unauthorized online media distribution.

By combining **Vision Transformers (ViT)**, **ArcFace deep facial embedding matching**, **Error Level Analysis (ELA)**, **Perceptual Hashing (pHash)**, **Resend transactional SOS alerts**, and **AI-driven legal assistance**, Kavach delivers instant verification, legal-grade case reports, and emergency response.

---

## 🚀 Key Features

### 1. 🛡️ Multi-Tier Deepfake Detection Engine
- **Image & Video Analysis**: Upload media files (JPG, PNG, WEBP, MP4, MOV) or input public web URLs to run real-time AI deepfake detection.
- **Primary Vision Transformer**: Uses `prithivMLmods/deepfake-detector-model-v1` — a **Vision Transformer (ViT)** image classifier running locally on PyTorch.
- **Multilayer Inspection**: Evaluates spatial artifacts, face warping, ELA (Error Level Analysis), spectral noise, entropy anomalies, and GAN-fingerprint signatures across fallback layers.
- **Instant Authenticity Verdict**: Generates clear confidence percentages (`Content Appears Authentic`, `AI Generated / Deepfake Detected`, `Face Not Matching`).

### 2. 👤 Face Matching & Biometric Identity Verification
- **Reference Image Comparison**: Upload target media along with a profile photo to determine if the face in the media matches the verified identity using **ArcFace 512-D embeddings (`DeepFace`)**.

### 3. 🔍 Perceptual Hashing (pHash) & Reverse Search
- **Visual Fingerprint Search**: Computes 64-bit perceptual hashes (`pHash`) and SHA-256 cryptographic digests to locate matching or cropped versions of images within registered user vaults.

### 4. 🔒 Proactive Digital Fingerprint Vault
- **Identity Shield**: Students can register original photos to generate unique digital fingerprints. If an unauthorized modified or cropped version of their image appears, the system flags it automatically.

### 5. 🚨 SOS Emergency Safety Hub & Live Location Broadcast
- **One-Click SOS Alert**: Instantly sends emergency emails to trusted emergency contacts via **Resend Transactional Email API** (no personal Gmail configuration required).
- **Live Location Geocoding**: Captures latitude/longitude and resolves detailed street/city address using OpenStreetMap Nominatim API.
- **24/7 Helplines**: Direct access to national & state-level women safety helplines (`1091`, `1930`, `112`, DCW, Mahila Police Stations).

### 6. 📑 Case Reporting & PDF Evidence Locker
- **Legal-Grade Evidence Generation**: File cases with optional **Anonymous Reporting**.
- **Automated PDF Export**: Generates official PDF reports (via `PDFKit`) containing SHA-256 hashes, AI confidence scores, forensic timestamps, and metadata for legal submission.

### 7. 🤖 AI Legal & Cybercrime Assistant
- **Interactive Legal Counselor**: AI chatbot providing instant legal advice tailored to Indian cyber laws.
- **Law Specialty**: Educates users on rights under the **Bharatiya Nyaya Sanhita (BNS 2023)**, **IT Act 2000** (Sections 66E, 66D, 67A, IPC 354C), POCSO guidelines, and zero-FIR procedures.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, Tailwind CSS, Framer Motion, Lucide React, React Router v6, React Hot Toast, Axios |
| **Backend API** | Node.js, Express.js, Mongoose ORM, PDFKit, Resend Email API, Multer, Helmet, Rate-Limit, JWT |
| **AI Microservice** | Python 3.11, FastAPI, Uvicorn, PyTorch, HuggingFace Transformers (ViT — `prithivMLmods/deepfake-detector-model-v1`), TensorFlow / tf-keras, DeepFace (ArcFace), OpenCV, ImageHash, SciPy, Pillow, HTTPX |
| **Email Service** | Resend API (`RESEND_API_KEY`) / Nodemailer SMTP Fallback |
| **Database** | MongoDB Community Edition (7.0+) |
| **Browser Extension**| Manifest v3 Chrome Extension (HTML5, Vanilla JS, CSS3) |

---

## 🧠 Machine Learning & AI Deep Dive

The Python AI Microservice (`ai-service/src/main.py`) utilizes a **Multi-Layer Detection Pipeline**:

```
                       [ Uploaded Media / URL ]
                                  │
                                  ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │ 1. Vision Transformer (ViT) Local Classifier                    │
 │    Model: prithivMLmods/deepfake-detector-model-v1              │
 │    Framework: PyTorch + HuggingFace Transformers                │
 └────────────────────────────────┬────────────────────────────────┘
                                  │ (Fallback if local load fails)
                                  ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │ 2. HuggingFace Inference API Ensemble                           │
 │    Models: SDXL-Detector, AI-Image-Detector, Deepfake-Detection │
 │    Weighted Softmax Voting Architecture                         │
 └────────────────────────────────┬────────────────────────────────┘
                                  │
                                  ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │ 3. Digital Forensic Signal Processing                           │
 │    • Error Level Analysis (ELA) — JPEG Compression Residuals    │
 │    • Laplacian High-Pass Filtering — Spectral Noise Residuals   │
 │    • Spatial Shannon Entropy Analysis                           │
 │    • EXIF Metadata Extraction                                   │
 └────────────────────────────────┬────────────────────────────────┘
                                  │
                                  ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │ 4. ArcFace Facial Embeddings & Perceptual Hashing               │
 │    • DeepFace ArcFace — 512-Dimensional Vector Cosine Distance  │
 │    • ImageHash — 64-bit DCT Perceptual Hashing (pHash/aHash)     │
 └────────────────────────────────┬────────────────────────────────┘
                                  │
                                  ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │ 5. Final Consolidated Score & Authenticity Verdict              │
 └─────────────────────────────────────────────────────────────────┘
```

### ML Codebase Locations:
- 📄 [`ai-service/src/main.py`](file:///Users/shrey/Desktop/Projects/kavach/kavach/ai-service/src/main.py): Production FastAPI inference service containing ViT, DeepFace, ELA, pHash, and Legal Chatbot logic.
- 📄 [`ai-service/src/train_deepfake.py`](file:///Users/shrey/Desktop/Projects/kavach/kavach/ai-service/src/train_deepfake.py): PyTorch training and fine-tuning pipeline for deepfake image datasets.
- 📄 [`ai-service/src/train_deepfake_model.py`](file:///Users/shrey/Desktop/Projects/kavach/kavach/ai-service/src/train_deepfake_model.py): TensorFlow / Keras CNN architecture training script.

---

## 📁 Project Directory Structure

```
kavach/
├── client/                     # React Frontend (Vite)
│   ├── src/
│   │   ├── pages/              # Landing, Dashboard, Upload, SafetyHub, Profile, AdminPanel, etc.
│   │   ├── components/         # LegalChatbot, Navbar, AnalysisResult, etc.
│   │   ├── services/           # Axios API services & OpenStreetMap location service
│   │   └── utils/              # Helper utilities
│   ├── index.html              # HTML Entrypoint
│   └── vite.config.js          # Vite config & dev server proxies (/api -> 5001, /ai -> 8001)
├── server/                     # Node.js Backend Server
│   ├── src/
│   │   ├── routes/             # auth, analysis, cases, fingerprint, search, safety, admin
│   │   ├── models/             # User, Analysis, Case, Fingerprint MongoDB Schemas
│   │   ├── services/           # email (Resend API), ai, pdf generation
│   │   └── index.js            # Express server entry point
│   └── .env                    # Server environment variables
├── ai-service/                 # Python AI Microservice
│   ├── src/
│   │   ├── main.py             # FastAPI server & multi-model detection pipeline
│   │   ├── train_deepfake.py   # PyTorch model training script
│   │   └── train_deepfake_model.py # TensorFlow/Keras model training script
│   ├── requirements.txt        # Python package dependencies
│   └── .env                    # AI Service environment keys
└── README.md                   # Project Documentation
```

---

## ⚙️ Environment Configuration (`.env`)

### 1. Backend Server (`server/.env`)
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/she-shield
JWT_SECRET=Kv@ch_S3cur3_JWT_2024_N4ar1K4vach_x9z7k2m5p8q
ADMIN_SECRET_CODE=NaariKavach2024Admin
AI_SERVICE_URL=http://localhost:8001
CLIENT_URL=http://localhost:3000

# Resend Email Service (Transactional SOS Email Alerts)
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=onboarding@resend.dev
```

### 2. AI Microservice (`ai-service/.env`)
```env
HF_API_KEY=your_huggingface_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

---

## 🏃 How to Run Locally (Step-by-Step Guide)

### Prerequisites

Ensure you have the following installed:
- **Node.js**: `v18.0.0+`
- **Python**: `3.11` *(Required for TensorFlow + DeepFace support)*
- **MongoDB**: Community Server `v7.0+` running locally on port `27017`

---

### Step 1: Start MongoDB Service
```bash
# macOS (Homebrew)
brew services start mongodb-community@7.0

# Linux / Windows
sudo systemctl start mongod
```

---

### Step 2: Start Python AI Microservice (Port 8001)

```bash
cd ai-service

# Install dependencies with Python 3.11
python3.11 -m pip install -r requirements.txt

# Start FastAPI Uvicorn server
python3.11 src/main.py
```
> *Output:* `Uvicorn running on http://0.0.0.0:8001`  
> *Health check URL:* `http://localhost:8001/health`

---

### Step 3: Start Node.js Backend Server (Port 5001)

```bash
cd server

# Install Node dependencies
npm install

# Start Express server with nodemon
npm run dev
```
> *Output:* `Server running on port 5001` · `Connected to MongoDB`

---

### Step 4: Start React Frontend Client (Port 3000)

```bash
cd client

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
> *Output:* `Vite server running at http://localhost:3000`

---

## 🧪 Testing the Complete Flow
1. Open `http://localhost:3000` in your browser.
2. **Register a new account** (or log in).
3. **Deepfake Scanner**: Upload an image to receive instant authenticity percentage & ViT confidence breakdown.
4. **Safety Hub**: Click **SOS Alert** to test real-time emergency email dispatch via Resend.
5. **Legal Chatbot**: Ask legal questions (e.g. *"What is IPC 354C?"*) to receive law section guidance.
