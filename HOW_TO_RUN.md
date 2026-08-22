# 🚀 How to Run the Document Summary Assistant

This guide provides step-by-step instructions to install, configure, and run the **Document Summary Assistant** project on your local machine.

---

## 📋 Prerequisites

Ensure you have the following installed:
- **Node.js**: `v18.0.0` or higher (Check with `node -v`)
- **npm**: `v9.0.0` or higher (Check with `npm -v`)

---

## ⚡ Quick Start (1-Command Run)

### 1. Install All Dependencies
Run from the project root directory:
```bash
npm run install:all
```
*This installs dependencies for the root workspace, Express backend server, and React Vite client.*

### 2. Start Backend & Frontend Concurrently
Run from the project root directory:
```bash
npm run dev
```

Once started:
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5001](http://localhost:5001)

---

## 🛠️ Step-by-Step Manual Execution

If you prefer to start the backend and frontend separately in two terminal tabs:

### Terminal 1: Backend Server
```bash
cd server
npm run dev
```
*(Server will start on http://localhost:5001)*

### Terminal 2: Frontend Client
```bash
cd client
npm run dev
```
*(Client will start on http://localhost:3000)*

---

## 🔑 Environment Variables & API Key Configuration (Optional)

The application includes an **intelligent offline heuristic NLP engine** so it works 100% out-of-the-box without requiring an API key.

If you wish to enable Google Gemini AI Summarization:

### Option A: Via Server `.env` File
Create a `.env` file in the `/server` folder:
```env
PORT=5001
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### Option B: Directly in the Web UI
1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Click **Set Gemini API Key** in the top navigation bar.
3. Paste your Gemini API key and click **Save Key**.

---

## 🧪 Testing the Application

1. Open [http://localhost:3000](http://localhost:3000).
2. Drag and drop any **PDF document** or **Scanned Image** (PNG, JPG, WEBP).
3. Alternatively, click **📊 Financial PDF Report** or **🧾 Scanned Image Invoice** under the dropzone to test with sample files instantly.
4. Select your preferred **Summary Length** (*Short*, *Medium*, or *Long*).
5. Click **Generate Smart Summary & Key Insights**.
6. View the tabbed results: Executive Summary, Key Points, Suggestions, Raw Extracted Text, and download as `.md` or `.txt`.

---

## 📦 Production Build

To build the frontend for production deployment:
```bash
npm run build
```
The compiled assets will be placed in `client/dist`.

To run the production server:
```bash
npm start
```
*(The server will serve both the REST API and the built static React frontend)*
