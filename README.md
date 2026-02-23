# SlideQuick

A modern web-based presentation editor that enables educators and professionals to create, customize, and present slides effortlessly — no design skills required.

> Built as a capstone project at Hanoi University of Science and Technology (HUST) — ITSS Japanese IT course.

**Live Demo:** [https://slide-quick.vercel.app/](https://slide-quick.vercel.app/)

## Key Features

- **Drag-and-Drop Editor** — Freely position text, images, and shapes on a canvas
- **Rich Text Formatting** — Bold, italic, underline with inline editing
- **Template Library** — Pre-built layouts (Title, Two-Column, Image+Text, etc.)
- **PDF & PPTX Export** — Pixel-accurate export for sharing and printing
- **Fullscreen Presentation** — Present directly from the browser with keyboard navigation
- **Real-Time Collaboration** — Multi-user editing powered by Yjs & WebSocket
- **Persistent Storage** — SQLite-backed project and slide management

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Express.js 5, Node.js |
| Database | SQLite (better-sqlite3) |
| Real-time | Yjs, y-websocket, WebSocket |
| Export | jsPDF, html2canvas, pptxgenjs |
| UI Icons | Lucide React |

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm**

### Installation

```bash
# Clone the repository
git clone https://github.com/cvkhang/SlideQuick.git
cd SlideQuick

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../server
npm install
```

### Running the App

```bash
# Terminal 1 — Start backend (http://localhost:3001)
cd server
npm run dev

# Terminal 2 — Start frontend (http://localhost:5173)
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
SlideQuick/
├── frontend/              # React + TypeScript SPA
│   └── src/
│       ├── components/    # SlideEditor, DraggableElement, TemplateLibrary
│       ├── pages/         # Home, Editor, Presentation
│       ├── context/       # Global state (AppContext)
│       ├── services/      # API client layer
│       ├── utils/         # PDF/PPTX export, layout utilities
│       └── types/         # TypeScript interfaces
├── server/                # Express.js REST API (MVC)
│   └── src/
│       ├── controllers/   # Route handlers
│       ├── models/        # Database models
│       ├── routes/        # API route definitions
│       └── server.js      # Entry point
└── README.md
```

