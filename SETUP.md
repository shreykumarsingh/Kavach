# SHE-SHIELD - Environment Setup

## Server (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/she-shield
JWT_SECRET=your-secure-jwt-secret-min-32-chars
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET=she-shield-uploads
AI_SERVICE_URL=http://localhost:8001
CLIENT_URL=http://localhost:3000
```

## Running the Application

### 1. Database
Start MongoDB:
```bash
mongod
```

### 2. Backend Server
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

### 3. Frontend
```bash
cd client
npm install
npm run dev
```

### 4. AI Service
```bash
cd ai-service
pip install -r requirements.txt
python src/main.py
```

## Chrome Extension
1. Open Chrome and go to chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the extensions/chrome-extension folder

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login
- GET /api/auth/me - Get current user

### Analysis
- POST /api/analysis/upload - Upload file for analysis
- POST /api/analysis/upload-url - Analyze URL
- GET /api/analysis/history - Get analysis history
- GET /api/analysis/:id - Get analysis result
- GET /api/analysis/:id/report - Download PDF report

### Cases
- POST /api/cases/create - Create case
- GET /api/cases/list - List cases
- PUT /api/cases/:id/status - Update case status

### Fingerprint
- POST /api/fingerprint/upload - Register fingerprint
- GET /api/fingerprint/list - List fingerprints

### Admin
- GET /api/admin/cases - Admin case list
- GET /api/admin/stats - Dashboard stats
