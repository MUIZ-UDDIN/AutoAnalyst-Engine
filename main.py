from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from backend.engine import ResearchEngine
import uuid
from datetime import datetime
import os
from fastapi.staticfiles import StaticFiles

app = FastAPI()

OUTPUT_DIR = "research_output"
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)
    
app.mount("/reports", StaticFiles(directory=OUTPUT_DIR), name="reports")

origins = [
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/research")
async def research_websocket(websocket: WebSocket):
    await websocket.accept()

    try:

        data = await websocket.receive_json()
        user_prompt = data.get("prompt")

        async def send_to_ui(category: str, data: str):
            if websocket.client_state.value != 1:
                return
            # LOG LOGIC: If it's a search/reason/save step
            if category in ["search", "analyze", "reason", "save"]:
                await websocket.send_json({
                    "type": "log",
                    "payload": {
                        "id": str(uuid.uuid4()),
                            "step": category,
                            "message": str(data), # Ensure data is a string
                            "timestamp": datetime.now().isoformat()
                        }
                    })

            # REPORT LOGIC: If it's the final report
            elif category == "report":
                await websocket.send_json({
                    "type": "report",
                    "payload": data # Here, data is the whole dictionary (markdown, title, etc.)
                })

            # COMPLETE LOGIC:
            elif category == "complete":
                await websocket.send_json({
                    "type": "complete",
                    "payload": {"message": str(data)}
                })

        engine = ResearchEngine()
        await engine.run(user_prompt, on_step=send_to_ui)

        # After engine finishes, send the "complete" signal
        await websocket.send_json({"type": "complete", "payload": {"message": "done"}})

    except WebSocketDisconnect:
        print("Client disconnected normally")

    except Exception as e:
        # 1. Log the full error to your terminal for debugging
        print(f"CRITICAL ERROR: {e}")

        # 2. Create a User-Friendly message
        error_msg = str(e)
        display_message = "An unexpected error occurred in the research engine."

        # Detect the specific Llama 'Tag Hallucination' error
        if "tool_use_failed" in error_msg:
            display_message = "The AI attempted an invalid tool format. Please try a simpler research goal."

        # 3. Send the error to the UI Thought Stream
        if websocket.client_state.value == 1:
            await websocket.send_json({
                "type": "log",
                "payload": {
                    "id": str(uuid.uuid4()),
                    "step": "error", # This triggers the RED X icon in Claude's UI
                    "message": display_message,
                    "timestamp": datetime.now().isoformat()
                }
            })
            
            # 4. Optional: Send a 'complete' type to stop the frontend spinner
            await websocket.send_json({"type": "complete", "payload": {"message": "failed"}})

@app.get("/api/artifacts")
async def get_artifacts():
    output_path = "./research_output" # Ensure this matches your config
    artifacts = []
    
    if os.path.exists(output_path):
        for filename in os.listdir(output_path):
            if filename.endswith(".md"):
                stats = os.stat(os.path.join(output_path, filename))
                artifacts.append({
                    "id": filename,
                    "filename": filename,
                    "title": filename.replace(".md", "").replace("_", " ").title(),
                    "createdAt": datetime.fromtimestamp(stats.st_mtime).isoformat(),
                    "sizeKb": round(stats.st_size / 1024, 1),
                    "downloadUrl": f"http://localhost:8000/reports/{filename}"
                })
    return artifacts