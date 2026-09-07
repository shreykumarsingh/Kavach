// Content script for SHE-SHIELD Chrome Extension

(function() {
  'use strict';

  let isSelectionMode = false;
  let selectionOverlay = null;
  let selectedElement = null;

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'captureScreenshot') {
      captureScreenshot()
        .then(imageData => sendResponse({ imageData }))
        .catch(error => sendResponse({ error: error.message }));
      return true;
    }

    if (message.action === 'enableSelectionMode') {
      enableSelectionMode();
      sendResponse({ success: true });
    }

    if (message.action === 'disableSelectionMode') {
      disableSelectionMode();
      sendResponse({ success: true });
    }
  });

  // Capture screenshot of visible area
  async function captureScreenshot() {
    try {
      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Get viewport dimensions
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      canvas.width = width;
      canvas.height = height;
      
      // Use html2canvas approach or native capture
      // For now, we'll capture visible images from the page
      
      // Get all images on the page
      const images = Array.from(document.querySelectorAll('img'));
      
      if (images.length === 0) {
        throw new Error('No images found on this page');
      }
      
      // Find the largest image
      let largestImage = images[0];
      let maxArea = 0;
      
      images.forEach(img => {
        const area = img.naturalWidth * img.naturalHeight;
        if (area > maxArea) {
          maxArea = area;
          largestImage = img;
        }
      });
      
      // Draw the largest image to canvas
      return new Promise((resolve, reject) => {
        largestImage.crossOrigin = 'anonymous';
        
        largestImage.onload = () => {
          canvas.width = largestImage.naturalWidth;
          canvas.height = largestImage.naturalHeight;
          ctx.drawImage(largestImage, 0, 0);
          
          try {
            const imageData = canvas.toDataURL('image/png');
            resolve(imageData);
          } catch (e) {
            reject(new Error('Failed to capture image'));
          }
        };
        
        largestImage.onerror = () => {
          reject(new Error('Failed to load image'));
        };
      });
    } catch (error) {
      console.error('Screenshot capture error:', error);
      throw error;
    }
  }

  // Enable image selection mode
  function enableSelectionMode() {
    if (isSelectionMode) return;
    isSelectionMode = true;

    // Create overlay
    selectionOverlay = document.createElement('div');
    selectionOverlay.id = 'she-shield-selection-overlay';
    selectionOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(139, 92, 246, 0.1);
      z-index: 2147483646;
      cursor: crosshair;
    `;

    // Add instruction banner
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #8b5cf6, #ec4899);
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 600;
      z-index: 2147483647;
      box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
    `;
    banner.textContent = 'Click on an image to analyze it with SHE-SHIELD';
    
    // Add cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel (ESC)';
    cancelBtn.style.cssText = `
      margin-left: 16px;
      padding: 6px 12px;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 6px;
      color: white;
      cursor: pointer;
      font-size: 12px;
    `;
    cancelBtn.onclick = disableSelectionMode;
    banner.appendChild(cancelBtn);

    document.body.appendChild(selectionOverlay);
    document.body.appendChild(banner);

    // Add hover effect to images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      img.style.cursor = 'pointer';
      img.style.transition = 'outline 0.2s ease';
      
      img.addEventListener('mouseenter', () => {
        img.style.outline = '3px solid #8b5cf6';
      });
      
      img.addEventListener('mouseleave', () => {
        if (selectedElement !== img) {
          img.style.outline = 'none';
        }
      });

      img.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectImage(img);
      });
    });

    // Handle escape key
    document.addEventListener('keydown', handleEscape);
  }

  // Disable selection mode
  function disableSelectionMode() {
    if (!isSelectionMode) return;
    isSelectionMode = false;

    if (selectionOverlay) {
      selectionOverlay.remove();
      selectionOverlay = null;
    }

    // Remove banner
    const banner = document.querySelector('#she-shield-selection-overlay + div');
    if (banner) banner.remove();

    // Remove image styles
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      img.style.cursor = '';
      img.style.outline = '';
    });

    document.removeEventListener('keydown', handleEscape);
  }

  function handleEscape(e) {
    if (e.key === 'Escape') {
      disableSelectionMode();
    }
  }

  // Select and analyze an image
  async function selectImage(img) {
    selectedElement = img;
    img.style.outline = '3px solid #22c55e';

    try {
      // Create canvas and draw image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      
      const imageData = canvas.toDataURL('image/png');
      
      // Send to background script for analysis
      chrome.runtime.sendMessage({
        action: 'analyzeImage',
        imageData
      }, (response) => {
        if (response && response.success) {
          // Show notification with result
          showResultNotification(response.result);
        } else {
          showResultNotification(null, response?.error);
        }
        
        // Reset selection mode after a delay
        setTimeout(disableSelectionMode, 500);
      });
    } catch (error) {
      console.error('Image selection error:', error);
      alert('Failed to analyze image. Please try again.');
      disableSelectionMode();
    }
  }

  // Show result notification
  function showResultNotification(result, error) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: white;
      padding: 20px 24px;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 320px;
      animation: slideIn 0.3s ease;
    `;

    const score = result?.analysis?.result?.authenticityScore || 75;
    const isSafe = score >= 70;

    notification.innerHTML = `
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <div style="
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: ${isSafe ? '#dcfce7' : '#fee2e2'};
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${isSafe 
            ? '<svg style="width:24px;height:24px;color:#22c55e" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
            : '<svg style="width:24px;height:24px;color:#ef4444" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
          }
        </div>
        <div>
          <div style="font-size: 16px; font-weight: 600; color: #1e293b;">
            ${isSafe ? 'Image Appears Safe' : 'Suspicious Content'}
          </div>
          <div style="font-size: 13px; color: #64748b;">
            Authenticity: ${score}%
          </div>
        </div>
      </div>
      <div style="font-size: 13px; color: #64748b; line-height: 1.5;">
        ${isSafe 
          ? 'No signs of AI manipulation detected.'
          : 'Potential manipulation detected. Consider reporting through SHE-SHIELD.'
        }
      </div>
      <button onclick="this.parentElement.remove()" style="
        margin-top: 12px;
        width: 100%;
        padding: 10px;
        background: #f1f5f9;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        color: #475569;
      ">Dismiss</button>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  // Initialize
  console.log('SHE-SHIELD Scanner content script loaded');
})();
