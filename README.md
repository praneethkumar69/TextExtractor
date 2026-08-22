# 📄 Document Summary Assistant

An intelligent web application that takes any document — **PDF or scanned image** — and generates clean, structured, AI-powered summaries in seconds.

Built as part of the Software Engineer technical assessment.

---

## 🔗 Live Links

| Resource | Link |
|---|---|
| 🌐 Live Application | https://text-extractor-blond.vercel.app |
| 💻 GitHub Repository | https://github.com/praneethkumar69/TextExtractor |

---

## ✨ Features

- **📤 Document Upload** — Drag-and-drop or file picker support for PDFs and scanned images (JPG/PNG).
- **🔍 Smart Text Extraction**
  - PDF parsing that preserves document structure and formatting.
  - OCR (Optical Character Recognition) for scanned/image-based documents using **Tesseract**.
- **🧠 AI-Powered Summarization**
  - Generates smart, context-aware summaries.
  - Choose summary length: **Short / Medium / Long**.
  - Automatically highlights key points and main ideas.
- **⚡ Great UX**
  - Real-time loading states during upload, extraction, and summarization.
  - Clear, friendly error handling (invalid file types, unreadable scans, size limits, etc.).
  - Fully mobile-responsive design.
- **☁️ Deployed & Accessible**
  - Hosted on a reliable, scalable platform for instant access.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS |
| Backend | Node.js + Express |
| PDF Text Extraction | `pdf-parse` |
| OCR (Image → Text) | `Tesseract.js` |
| Summarization | Free-tier LLM API (e.g., Google Gemini / Cohere) |
| Hosting | Vercel (frontend) + Render (backend) |

> Update this table to match the exact libraries/services you actually used.

---

## 🏗️ Architecture & Approach

```
User Upload (PDF/Image)
        │
        ▼
 ┌─────────────────┐
 │  Frontend (React)│  → drag-drop UI, file validation, loading states
 └────────┬─────────┘
          │  API call
          ▼
 ┌───────────────────────────┐
 │      Backend (Express)     │
 │                             │
 │  1. Detect file type       │
 │  2. PDF → pdf-parse         │
 │     Image → Tesseract OCR  │
 │  3. Clean & chunk text     │
 │  4. Send to Summarization  │
 │     API (length param)     │
 └────────┬────────────────────┘
          │
          ▼
    Structured Summary
    (key points + full summary)
          │
          ▼
    Rendered back to user
```

**Approach in brief:**
The app separates concerns cleanly into extraction and summarization stages. On upload, the file type is detected — PDFs go through direct text parsing to preserve structure, while images are routed through an OCR pipeline. Extracted text is cleaned, chunked (to respect LLM context limits), and passed to a summarization API with a length parameter (short/medium/long). The frontend shows granular loading states at each stage (uploading → extracting → summarizing) so users always know what's happening, and errors are caught and surfaced with actionable messages rather than generic failures.

---

## 📂 Project Structure

```
document-summary-assistant/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UploadBox, SummaryView, Loader, ErrorAlert
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
├── server/                  # Express backend
│   ├── routes/
│   │   └── summarize.js
│   ├── services/
│   │   ├── pdfExtractor.js
│   │   ├── ocrExtractor.js
│   │   └── summarizer.js
│   ├── middleware/
│   │   └── errorHandler.js
│   └── index.js
├── .env.example
├── README.md
└── package.json
```

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone [your-repo-url]
cd document-summary-assistant
```

### 2. Install dependencies
```bash
# Frontend
cd client && npm install

# Backend
cd ../server && npm install
```

### 3. Configure environment variables
Create a `.env` file in `/server` based on `.env.example`:
```
PORT=5000
SUMMARIZATION_API_KEY=your_api_key_here
```

### 4. Run locally
```bash
# Start backend
cd server && npm run dev

# Start frontend (in a new terminal)
cd client && npm run dev
```

The app will be available at `http://localhost:3000`.

---

## 🧪 Error Handling & Edge Cases Covered

- Unsupported file types are rejected with a clear message.
- Oversized files are blocked before upload with a size-limit warning.
- Poor-quality scans that fail OCR return a "couldn't extract text" message with a retry prompt.
- API/network failures during summarization show a friendly retry option instead of a blank screen.

---

## 🚀 Possible Future Improvements

- Multi-language OCR support.
- Batch upload (summarize multiple documents at once).
- Export summaries as PDF/Word.
- User accounts to save summary history.
- Streaming summaries (word-by-word) for a faster perceived response.

---

## ✍️ Approach 

I approached this as a two-stage pipeline: **extraction** and **summarization**, kept intentionally decoupled so each stage is easy to test, swap, or improve independently. On the frontend, I built a simple drag-and-drop uploader with clear loading states for each phase (uploading, extracting, summarizing) so the user is never left guessing. On the backend, PDFs are parsed directly to preserve structure, while scanned images go through an OCR pipeline (Tesseract) to extract text. The extracted text is cleaned and chunked before being sent to a free-tier summarization API, with a length parameter controlling whether the output is short, medium, or long. I prioritized graceful error handling — invalid files, failed OCR, and API errors all return specific, actionable messages rather than silent failures. Given the 8-hour time constraint, I focused on a working, reliable core pipeline over extra features, keeping the codebase clean and documented so it's easy to extend later (multi-language OCR, batch uploads, export options). The result is a lightweight, mobile-responsive tool that turns any document into a digestible summary in a few seconds.

---

## 👤 Author

**Potupu Reddy Praneeth Kumar**
Submitted for: Software Engineer Technical Assessment — Unthinkable
