import { useEffect, useRef, useState } from 'react';
import type { SensorReading, AiAnalysis } from '@shared/schema';

interface WebSocketData {
  type: string;
  roomId: number;
  data?: SensorReading;
  analysis?: AiAnalysis;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  lastData: SensorReading | null;
  lastAnalysis: AiAnalysis | null;
  subscribe: (roomId: number) => void;
  disconnect: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastData, setLastData] = useState<SensorReading | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<AiAnalysis | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Clear any pending reconnection
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const data: WebSocketData = JSON.parse(event.data);
        
        if (data.type === 'sensorUpdate' && data.data) {
          setLastData(data.data);
          
          if (data.analysis) {
            setLastAnalysis(data.analysis);
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      
      // Attempt to reconnect after 3 seconds
      reconnectTimeout.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
  };

  const subscribe = (roomId: number) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'subscribe', roomId }));
    }
  };

  const disconnect = () => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    
    setIsConnected(false);
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    lastData,
    lastAnalysis,
    subscribe,
    disconnect
  };
}
