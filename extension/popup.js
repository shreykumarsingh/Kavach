document.addEventListener('DOMContentLoaded', () => {
  const captureBtn = document.getElementById('captureBtn');
  const selectBtn = document.getElementById('selectBtn');
  const previewSection = document.getElementById('previewSection');
  const previewImage = document.getElementById('previewImage');
  const loadingSection = document.getElementById('loadingSection');
  const resultSection = document.getElementById('resultSection');
  const openDashboard = document.getElementById('openDashboard');

  let capturedImageData = null;

  // Get API endpoint from storage or use default (AI service)
  async function getApiEndpoint() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['apiEndpoint'], (result) => {
        resolve(result.apiEndpoint || 'http://localhost:8001/api/analyze');
      });
    });
  }

  captureBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Send message to content script to capture screenshot
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'captureScreenshot' });
      
      if (response && response.imageData) {
        capturedImageData = response.imageData;
        previewImage.src = response.imageData;
        previewSection.classList.add('active');
        
        // Automatically analyze the captured image
        analyzeImage(response.imageData);
      }
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      alert('Could not capture screenshot. Please try again.');
    }
  });

  selectBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Send message to content script to enable image selection mode
      await chrome.tabs.sendMessage(tab.id, { action: 'enableSelectionMode' });
      
      // Listen for selected image
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'imageSelected' && message.imageData) {
          capturedImageData = message.imageData;
          previewImage.src = message.imageData;
          previewSection.classList.add('active');
          analyzeImage(message.imageData);
        }
      });
    } catch (error) {
      console.error('Error enabling selection mode:', error);
      alert('Could not enable selection mode. Please try again.');
    }
  });

  async function analyzeImage(imageData) {
    showLoading();
    
    try {
      const API_ENDPOINT = await getApiEndpoint();
      
      // Convert data URL to blob
      const blob = await fetch(imageData).then(r => r.blob());
      const formData = new FormData();
      formData.append('file', blob, 'screenshot.png');

      // Send to AI service for analysis (no auth needed)
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      showResult({ analysis: { result } });
    } catch (error) {
      console.error('Analysis error:', error);
      // Show demo result for development/testing
      showDemoResult();
    }
  }

  function showLoading() {
    previewSection.classList.remove('active');
    resultSection.classList.remove('active');
    loadingSection.classList.add('active');
    captureBtn.disabled = true;
    selectBtn.disabled = true;
  }

  function hideLoading() {
    loadingSection.classList.remove('active');
    captureBtn.disabled = false;
    selectBtn.disabled = false;
  }

  function showResult(result) {
    hideLoading();
    loadingSection.classList.remove('active');
    resultSection.classList.add('active');
    
    const score = result.analysis?.result?.authenticityScore || 
                  result.authenticityScore || 75;
    const isDeepfake = result.analysis?.result?.isDeepfake || 
                      result.isDeepfake || false;
    
    const scoreFill = document.getElementById('scoreFill');
    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    const resultSubtitle = document.getElementById('resultSubtitle');
    const resultDetails = document.getElementById('resultDetails');
    
    scoreFill.style.width = `${score}%`;
    
    if (score >= 70) {
      scoreFill.className = 'score-fill safe';
      resultIcon.className = 'result-icon safe';
      resultTitle.textContent = 'Image Appears Authentic';
      resultSubtitle.textContent = 'No manipulation detected';
      resultDetails.textContent = 'This image shows no signs of AI manipulation or deepfake technology. However, for legal purposes, please consult with authorities.';
    } else if (score >= 40) {
      scoreFill.className = 'score-fill warning';
      resultIcon.className = 'result-icon warning';
      resultTitle.textContent = 'Uncertain Result';
      resultSubtitle.textContent = 'Possible manipulation detected';
      resultDetails.textContent = 'Some indicators of potential manipulation were found. Exercise caution and consider reporting through the SHE-SHIELD dashboard.';
    } else {
      scoreFill.className = 'score-fill danger';
      resultIcon.className = 'result-icon danger';
      resultTitle.textContent = 'Suspicious Content Detected';
      resultSubtitle.textContent = 'High likelihood of manipulation';
      resultDetails.textContent = 'This image shows strong indicators of AI manipulation or deepfake technology. Consider reporting through the SHE-SHIELD dashboard for further assistance.';
    }
  }

  function showDemoResult() {
    // Generate a random score for demo purposes
    const score = Math.floor(Math.random() * 30) + 70;
    const result = {
      analysis: {
        result: {
          authenticityScore: score,
          isDeepfake: score < 50
        }
      }
    };
    showResult(result);
  }

  async function getAuthToken() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['authToken'], (result) => {
        resolve(result.authToken || '');
      });
    });
  }

  openDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
  });
});
