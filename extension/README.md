# SHE-SHIELD Scanner Chrome Extension

AI-powered deepfake detection extension for Chrome. Capture and analyze suspicious images while browsing.

## Features

- **Quick Screenshot Analysis**: Capture the visible page and analyze all images
- **Selective Image Scan**: Click on any specific image to analyze it
- **Real-time Detection**: Get instant feedback on potential deepfake content
- **Seamless Integration**: Works with your SHE-SHIELD dashboard account

## Installation

### Option 1: Load as Unpacked Extension (Development)

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder from this project
5. The extension icon will appear in your toolbar

### Option 2: Build for Distribution

1. Zip the entire `extension` folder
2. Submit to Chrome Web Store (requires $5 one-time fee)

## Configuration

Before using the extension, you need to configure the backend API:

1. Open the extension popup
2. Click on "Open SHE-SHIELD Dashboard"
3. Login and copy your auth token
4. Right-click the extension icon > Options
5. Enter your backend URL and auth token

Or update the `API_ENDPOINT` in `popup.js`:

```javascript
const API_ENDPOINT = 'http://your-backend-url.com/api/analysis/analyze';
```

## Usage

### Method 1: Capture & Analyze
1. Navigate to any webpage with suspicious content
2. Click the SHE-SHIELD icon in your toolbar
3. Click "Capture & Analyze Image"
4. View the analysis results

### Method 2: Select Specific Image
1. Navigate to any webpage
2. Click "Select Specific Image" in the extension popup
3. Click directly on any image you want to analyze
4. View the results in a notification

### Method 3: Quick Scan
1. Right-click on any image on a webpage
2. Select "Analyze with SHE-SHIELD"
3. View results

## How It Works

1. **Capture**: The extension captures the selected image from the webpage
2. **Send**: The image is securely sent to the SHE-SHIELD backend API
3. **Analyze**: AI models analyze the image for manipulation indicators
4. **Result**: You receive instant feedback with an authenticity score

## Privacy

- Images are only sent when you explicitly trigger analysis
- No automated scraping or tracking
- Your browsing history remains private
- All transmissions are encrypted

## Backend API Requirements

The extension expects the following API endpoint:

```
POST /api/analysis/analyze
Content-Type: multipart/form-data

Body:
- file: Image file (PNG, JPG, JPEG, WEBP)
- reportingMode: "anonymous" or "confidential"
- source: "browser-extension"

Response:
{
  "success": true,
  "analysis": {
    "_id": "...",
    "fileName": "screenshot.png",
    "result": {
      "isDeepfake": false,
      "authenticityScore": 85,
      "confidence": 0.95
    },
    "caseId": "CASE-12345"
  }
}
```

## Files Structure

```
extension/
├── manifest.json      # Extension configuration
├── popup.html         # Extension popup UI
├── popup.js          # Popup logic
├── background.js     # Background service worker
├── content.js        # Content script for page interaction
├── content.css       # Content script styles
├── icons/
│   ├── icon16.png    # Toolbar icon (16x16)
│   ├── icon48.png    # Extension page icon (48x48)
│   └── icon128.png   # Store icon (128x128)
└── README.md         # This file
```

## Creating Icons

The extension requires three icon sizes. You can create them from a 512x512 PNG:

```bash
# Using ImageMagick
convert -resize 16x16 icon512.png icons/icon16.png
convert -resize 48x48 icon512.png icons/icon48.png
convert -resize 128x128 icon512.png icons/icon128.png
```

Or use any image editing tool to create:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

## Troubleshooting

### Extension not loading
- Make sure "Developer mode" is enabled in `chrome://extensions/`
- Check for any error messages in the extension details

### Images not capturing
- Ensure the website allows image loading
- Some websites may block canvas operations (CORS)

### Analysis failing
- Verify your backend API is running
- Check the API endpoint URL in the code
- Ensure you have a valid auth token

## Support

For issues or feature requests, please contact the SHE-SHIELD team.

## License

Proprietary - SHE-SHIELD Project
