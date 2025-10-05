import { useEffect, useRef, useState, useCallback } from 'react';
import config from '../config/environment';

export const useWebSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  const connect = useCallback((url) => {
    try {
      if (socketRef.current) {
        socketRef.current.close();
      }
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        if (config.debug) console.log('WS connected');
      };

      ws.onmessage = (event) => {
        setLastMessage(event.data);
      };

      ws.onerror = (err) => {
        if (config.debug) console.error('WS error', err);
      };

      ws.onclose = () => {
        setIsConnected(false);
      };
    } catch (err) {
      setIsConnected(false);
      if (config.debug) console.error('WS connect failed', err);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const sendMessage = useCallback((message, userId = config.defaultUserId) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      if (config.debug) console.warn('WS not connected');
      return;
    }
    const payload = JSON.stringify({ message, user_id: userId });
    socketRef.current.send(payload);
  }, []);

  useEffect(() => () => {
    if (socketRef.current) socketRef.current.close();
  }, []);

  return { connect, disconnect, sendMessage, isConnected, lastMessage };
};





