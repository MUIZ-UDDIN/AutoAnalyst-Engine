# AutoAnalyst Engine

An autonomous AI research agent that searches the web, synthesizes findings, and generates professional Markdown reports — all through a real-time WebSocket-powered dashboard.

## UI

<img width="1376" height="709" alt="image" src="https://github.com/user-attachments/assets/29b09b59-38c0-4067-915d-0975d107a0c2" />

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Frontend (Next.js)              │
│  ┌──────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Artifacts │  │ Thought      │  │ Report    │ │
│  │ Sidebar   │  │ Stream (logs)│  │ Viewer    │ │
│  └──────────┘  └──────────────┘  └───────────┘ │
│                    │ WebSocket                    │
└────────────────────┼─────────────────────────────┘
                     │ ws://localhost:8000/ws/research
┌────────────────────┼─────────────────────────────┐
│            Backend (FastAPI)                      │
│  ┌──────────────┐  ┌────────────┐  ┌──────────┐ │
│  │ main.py      │→ │engine.py   │→ │tools.py  │ │
│  │ (WebSocket)  │  │(Research   │  │(Tavily   │ │
│  │ + REST API)  │  │Engine)     │  │search +  │ │
│  │              │  │            │  │save file)│ │
│  └──────────────┘  └────────────┘  └──────────┘ │
│                           │                      │
│                    ┌──────┴──────┐               │
│                    │  Groq API   │               │
│                    │  (LLaMA 3.1)│               │
│                    └─────────────┘               │
└──────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | Python 3.14, FastAPI, Uvicorn |
| AI Model | LLaMA 3.1 8B (via Groq API) |
| Web Search | Tavily Search API |
| Communication | WebSocket (real-time), REST API |

## Features

- **Autonomous Research:** Give it a topic, it searches the web and writes a full report
- **Live Thought Stream:** Watch the agent's reasoning and search steps in real-time
- **Professional Reports:** Structured output with Executive Summary, Findings, Analysis, and Sources
- **Artifact Management:** Download or delete past reports from the sidebar
- **Multi-search Strategy:** The agent performs 3-5 searches from different angles for thorough coverage

## Setup

### Prerequisites

- Python 3.14+
- Node.js 20+
- API keys from [Groq](https://console.groq.com) and [Tavily](https://tavily.com)

### 1. Clone and install

```bash
# Backend
python -m venv .venv
.venv\Scripts\activate    # Windows
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### 2. Environment variables

Create a `.env` file in the project root:

```env
groq_api="gsk_your_groq_api_key_here"
tavily_api="tvly-your_tavily_api_key_here"
```

### 3. Run

Open two terminals:

```bash
# Terminal 1 — Backend (from project root)
uv run uvicorn main:app --reload

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start researching.

## Project Structure

```
AutoAnalyst-Engine/
├── main.py                  # FastAPI server (WebSocket + REST endpoints)
├── backend/
│   ├── config.py            # Environment config, API keys
│   ├── engine.py            # ResearchEngine — orchestrates the AI loop
│   ├── schema.py            # Tool definitions for the LLM
│   └── tools.py             # AgentTools — search_web & save_report
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js pages
│   │   ├── components/      # Dashboard, InputArea, ThoughtStream, etc.
│   │   ├── services/        # WebSocket client
│   │   ├── types/           # TypeScript type definitions
│   │   └── lib/             # Utilities (cn, formatTimestamp, etc.)
│   └── package.json
├── research_output/          # Saved reports (gitignored)
└── .env                      # API keys (gitignored)
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| WebSocket | `/ws/research` | Real-time research session |
| GET | `/api/reports/{filename}` | Download a saved report |
| DELETE | `/api/artifacts/{filename}` | Delete a saved report |
