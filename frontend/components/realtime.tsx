"use client";

import React, { useEffect, useRef, useState } from 'react';

type MessagePayload = {
  id?: string;
  content?: string;
  created_at?: string;
  [key: string]: any;
};

export default function Realtime() {
  const [messages, setMessages] = useState<MessagePayload[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const WS_URL = (process.env.NEXT_PUBLIC_WS_URL as string) || 'ws://localhost:8080';

    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Realtime: connected to', WS_URL);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages((prev) => [data, ...prev].slice(0, 50));
        } catch (err) {
          console.warn('Realtime: failed to parse message', err, event.data);
        }
      };

      ws.onerror = (err) => {
        console.error('Realtime: websocket error', err);
        // close will trigger reconnect
      };

      ws.onclose = () => {
        console.log('Realtime: socket closed');
        if (!cancelled) {
          const timeout = Math.min(30000, 1000 * Math.pow(2, reconnectAttempts.current));
          reconnectAttempts.current += 1;
          setTimeout(connect, timeout);
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
  }, []);

  return (
    <div className="p-4 border rounded-md">
      <h3 className="text-lg font-semibold">Live updates</h3>
      <p className="text-sm text-muted-foreground">Connected via WebSocket (ws://localhost:8080)</p>
      <ul className="mt-3 space-y-2 max-h-64 overflow-auto">
        {messages.length === 0 && <li className="text-sm text-gray-500">No messages yet</li>}
        {messages.map((m) => (
          <li key={m.id || m.created_at || Math.random()} className="text-sm">
            <div className="font-medium">{m.content ?? JSON.stringify(m)}</div>
            {m.created_at && <div className="text-xs text-gray-500">{m.created_at}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
