"use client";

import { WsMessage } from "@/types";

 
export class AgentWebSocket {
  private ws: WebSocket;
 
  constructor(
    query: string,
    onMessage: (msg: WsMessage) => void,
    onClose: () => void
  ) {
    this.ws = new WebSocket("ws://localhost:8000/ws/research");
    this.ws.onopen = () => {

      const payload = JSON.stringify({prompt: query });
      this.ws.send(payload);
    };

    this.ws.onmessage = (e) => onMessage(JSON.parse(e.data));
    this.ws.onclose = onClose;
    this.ws.onerror = (e) => console.error("WS error:", e);
  }
  

  public disconnect() { 
    if (this.ws) {
      this.ws.close(); 
    }
  }
}