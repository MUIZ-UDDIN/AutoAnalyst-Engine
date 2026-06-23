import sys
import json
import asyncio
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

sys.path.insert(0, str(Path(__file__).parent))

from backend.engine import ResearchEngine
from backend.config import OUTPUT_DIR


app = FastAPI(title="AutoAnalyst Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.websocket("/ws/research")
async def research_websocket(websocket: WebSocket):
    await websocket.accept()

    try:
        raw = await websocket.receive_text()
        data = json.loads(raw)
        prompt = data.get("prompt", "")
    except Exception as e:
        await websocket.send_json({"type": "error", "payload": {"message": f"Invalid input: {e}"}})
        await websocket.close()
        return

    engine = ResearchEngine()

    async def on_step(step_type: str, data):
        """Bridge: convert backend step types → frontend WsMessage format."""
        if step_type in ("reason", "search", "analyze"):
            log_entry = {
                "id": str(uuid.uuid4()),
                "step": step_type,
                "message": str(data),
                "timestamp": datetime.now().isoformat(),
            }
            await websocket.send_json({"type": "log", "payload": log_entry})

        elif step_type == "final":
            log_entry = {
                "id": str(uuid.uuid4()),
                "step": "complete",
                "message": str(data),
                "timestamp": datetime.now().isoformat(),
            }
            await websocket.send_json({"type": "log", "payload": log_entry})

        elif step_type == "report":
            await websocket.send_json({"type": "report", "payload": data})

        elif step_type == "complete":
            await websocket.send_json({"type": "complete", "payload": {"message": str(data)}})

        elif step_type == "error":
            await websocket.send_json({"type": "error", "payload": {"message": str(data)}})

    try:
        await engine.run(prompt, on_step)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "payload": {"message": f"Engine error: {e}"}})
        except WebSocketDisconnect:
            pass


@app.get("/api/reports/{filename:path}")
async def download_report(filename: str):
    filepath = OUTPUT_DIR / filename
    if not filepath.exists():
        filepath = OUTPUT_DIR / (filename + ".md") if not filename.endswith(".md") else filepath
    if filepath.exists():
        return FileResponse(filepath, media_type="text/markdown", filename=filepath.name)
    return {"error": "File not found"}


@app.delete("/api/artifacts/{filename:path}")
async def delete_artifact(filename: str):
    filepath = OUTPUT_DIR / filename
    if not filepath.exists():
        filepath = OUTPUT_DIR / (filename + ".md") if not filename.endswith(".md") else filepath
    if filepath.exists():
        filepath.unlink()
        return {"status": "deleted", "filename": filename}
    return {"error": "File not found"}