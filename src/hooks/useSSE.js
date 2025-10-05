import { useState, useCallback, useRef } from 'react';
import config from '../config/environment';

export const useSSE = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const eventSourceRef = useRef(null);

  // Generate a unique session ID
  const generateSessionId = useCallback(() => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }, []);

  const connect = useCallback((url, sessionIdParam = null) => {
    try {
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Generate or use provided session ID
      const currentSessionId = sessionIdParam || generateSessionId();
      setSessionId(currentSessionId);

      // Create session-based SSE URL
      const sseUrl = `${url}/${currentSessionId}`;
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      // Connection opened
      eventSource.onopen = () => {
        console.log('SSE connection opened with session:', currentSessionId);
        setIsConnected(true);
      };

      // Message received
      eventSource.onmessage = (event) => {
        console.log('SSE message received:', event.data);
        setLastMessage(event.data);
      };

      // Error occurred
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (eventSource.readyState === EventSource.CLOSED) {
            console.log('Attempting to reconnect...');
            connect(url, currentSessionId);
          }
        }, 3000);
      };

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      setIsConnected(false);
    }
  }, [generateSessionId]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      console.log('SSE connection closed');
    }
  }, []);

  const sendMessage = useCallback(async (message, userId = config.defaultUserId) => {
    if (!isConnected || !sessionId) {
      console.warn('Cannot send message: not connected or no session ID');
      return;
    }

    try {
      // Send message to the session-based message endpoint
      const baseUrl = config.agentApiBaseUrl;
      const messageUrl = `${baseUrl}/sse/chat/${sessionId}/message`;

      const response = await fetch(messageUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: message,
          user_id: userId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      console.log('Message sent successfully to session:', sessionId);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [isConnected, sessionId]);

  const reinitialize = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    setIsConnected(false);
    setLastMessage(null);
    console.log('SSE session reinitialized with new session ID:', newSessionId);
  }, [generateSessionId]);

  return {
    connect,
    disconnect,
    sendMessage,
    reinitialize,
    isConnected,
    lastMessage,
    sessionId,
  };
};
