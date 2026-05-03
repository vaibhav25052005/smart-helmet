import { useState, useCallback, useRef } from "react";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface HelmetData {
  helmetWorn: boolean | null;
  alcoholDetected: boolean | null;
  alcoholValue: number | null;
  drowsy: boolean | null;
  motorOn: boolean | null;
  ledOn: boolean | null;
  buzzerOn: boolean | null;
  distance: number | null;
  rssi: number | null;
  sos: boolean | null;
  lastUpdated: Date | null;
}

function parseHelmetData(raw: string): Partial<HelmetData> {
  const result: Partial<HelmetData> = {};
  const parts = raw.trim().split(",");
  for (const part of parts) {
    const [key, val] = part.trim().split(":");
    if (!key || val === undefined) continue;
    const k = key.trim().toLowerCase();
    const v = val.trim().toLowerCase();
    if (k === "helmet") result.helmetWorn = v === "1" || v === "worn";
    if (k === "alcohol") result.alcoholDetected = v === "1" || v === "detected";
    if (k === "mq3") result.alcoholValue = parseFloat(v) || 0;
    if (k === "drowsy") result.drowsy = v === "1" || v === "sleep";
    if (k === "motor") result.motorOn = v === "1" || v === "on";
    if (k === "led") result.ledOn = v === "1" || v === "on";
    if (k === "buzzer") result.buzzerOn = v === "1" || v === "on";
    if (k === "dist" || k === "distance") result.distance = parseFloat(v) || 0;
    if (k === "rssi") result.rssi = parseFloat(v) || 0;
    if (k === "sos") result.sos = v === "1" || v === "active";
  }
  return result;
}

export function useWifi(onData: (data: Partial<HelmetData>, raw?: string) => void) {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const bufferRef = useRef<string>("");
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ipRef = useRef<string>("");

  const clearReconnect = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";

  const connect = useCallback((ip: string, port: string = "81") => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    clearReconnect();
    ipRef.current = ip;
    setStatus("connecting");
    setError(null);

    // Browsers block ws:// from https:// pages (mixed content).
    // Detect this early and give a clear actionable message.
    if (isHttps) {
      setStatus("error");
      setError("HTTPS_BLOCK");
      return;
    }

    const url = `ws://${ip}:${port}/`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      setError(null);
      bufferRef.current = "";
    };

    ws.onmessage = (event) => {
      const text = typeof event.data === "string" ? event.data : "";
      if (!text.trim()) return;

      // Handle both single-line and multi-line data
      const lines = text.split("\n");
      for (const line of lines) {
        if (line.trim()) {
          const parsed = parseHelmetData(line);
          onData({ ...parsed, lastUpdated: new Date() }, line);
        }
      }
    };

    ws.onerror = () => {
      setStatus("error");
      setError(`Could not reach ws://${ip}:${port} — make sure the ESP32 is powered on and on the same WiFi network.`);
    };

    ws.onclose = (evt) => {
      if (evt.code === 1006) {
        setStatus("error");
        setError(isHttps ? "HTTPS_BLOCK" : `Connection dropped (code 1006). The ESP32 refused or could not be reached at ${ip}:${port}.`);
      } else if (evt.code !== 1000) {
        setStatus("error");
        setError(`Connection closed (code ${evt.code}). Check the ESP32 is reachable.`);
      } else {
        setStatus("disconnected");
      }
    };
  }, [onData, isHttps]);

  const disconnect = useCallback(() => {
    clearReconnect();
    if (wsRef.current) {
      wsRef.current.close(1000, "User disconnected");
      wsRef.current = null;
    }
    setStatus("disconnected");
    setError(null);
  }, []);

  return { status, error, connect, disconnect };
}
