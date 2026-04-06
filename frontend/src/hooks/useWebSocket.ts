import { useEffect, useRef, useState, useCallback } from "react";

export interface WebSocketMessage {
  type: "new_transaction" | "new_anomaly" | "stats_update";
  data: any;
}

interface UseWebSocketOptions {
  onMessage: (msg: WebSocketMessage) => void;
  url?: string;
}

export function useWebSocket({ onMessage, url }: UseWebSocketOptions) {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    const wsUrl = url || `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.hostname}:8000/ws/dashboard`;
    
    // For development, use localhost
    const devUrl = import.meta.env.DEV 
      ? "ws://localhost:8000/ws/dashboard" 
      : wsUrl;

    ws.current = new WebSocket(devUrl);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
      setConnected(true);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
      setConnected(false);
      reconnectTimeout.current = setTimeout(connect, 3000);
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }, [onMessage, url]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return { connected };
}
