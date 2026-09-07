// Background service worker for SHE-SHIELD Chrome Extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('SHE-SHIELD Scanner extension installed');
    
    // Set default settings
    chrome.storage.local.set({
      scanCount: 0,
      lastScan: null,
      authToken: ''
    });
    
    // Create context menu
    createContextMenu();
  }
});

// Create context menu for right-click analysis
function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    // Main menu item
    chrome.contextMenus.create({
      id: 'she-shield-parent',
      title: 'SHE-SHIELD',
      contexts: ['image']
    });
    
    // Analyze this image
    chrome.contextMenus.create({
      id: 'analyze-image',
      parentId: 'she-shield-parent',
      title: 'Analyze with SHE-SHIELD',
      contexts: ['image']
    });
    
    // Report suspicious content
    chrome.contextMenus.create({
      id: 'report-content',
      parentId: 'she-shield-parent',
      title: 'Report Suspicious Content',
      contexts: ['image']
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'analyze-image' && info.srcUrl) {
    try {
      // Get the image URL and analyze it
      const imageUrl = info.srcUrl;
      
      // Fetch the image and convert to base64
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onload = async () => {
        const imageData = reader.result;
        
        // Send to content script to show loading and result
        chrome.tabs.sendMessage(tab.id, {
          action: 'showQuickResult',
          imageData
        });
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error analyzing image from context menu:', error);
    }
  }
  
  if (info.menuItemId === 'report-content' && info.srcUrl) {
    // Open the SHE-SHIELD dashboard with the image URL
    chrome.tabs.create({
      url: `http://localhost:3000/upload?mode=url&report=true&imageUrl=${encodeURIComponent(info.srcUrl)}`
    });
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'analyzeImage') {
    analyzeImage(message.imageData)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Indicates async response
  }

  if (message.action === 'logScan') {
    logScanResult(message.result);
  }
});

// Analyze image using the backend API
async function analyzeImage(imageData) {
  // Get API endpoint from storage or use default
  const { apiEndpoint } = await chrome.storage.local.get(['apiEndpoint']);
  const API_ENDPOINT = apiEndpoint || 'http://localhost:5001/api/analyze';
  
  try {
    // Get auth token from storage
    const { authToken } = await chrome.storage.local.get(['authToken']);
    
    // Convert base64 to blob
    const response = await fetch(imageData);
    const blob = await response.blob();
    
    // Create form data
    const formData = new FormData();
    formData.append('file', blob, 'screenshot.png');

    // Send to AI service directly (no auth needed for basic analysis)
    const result = await fetch(API_ENDPOINT, {
      method: 'POST',
      body: formData,
    });

    if (!result.ok) {
      throw new Error('Analysis request failed');
    }

    const analysis = await result.json();
    
    // Log the scan
    logScanResult(analysis);
    
    return { analysis };
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}

// Log scan results locally
async function logScanResult(result) {
  const { scanCount, scanHistory } = await chrome.storage.local.get(['scanCount', 'scanHistory']);
  
  const newScan = {
    timestamp: new Date().toISOString(),
    score: result.analysis?.result?.authenticityScore || 0,
    isDeepfake: result.analysis?.result?.isDeepfake || false,
    caseId: result.analysis?.caseId || null
  };

  await chrome.storage.local.set({
    scanCount: (scanCount || 0) + 1,
    lastScan: newScan,
    scanHistory: [newScan, ...(scanHistory || [])].slice(0, 50) // Keep last 50 scans
  });
}

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  // This will open the popup since we defined default_popup in manifest
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { analyzeImage, logScanResult, createContextMenu };
}
