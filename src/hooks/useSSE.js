import { useState, useCallback, useRef } from 'react';
import config from '../config/environment';

export const useSSE = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const eventSourceRef = useRef(null);

  const connect = useCallback((url) => {
    try {
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Create new EventSource connection
      // Append user_id so the agent can correlate streams
      const userIdParam = encodeURIComponent(config.defaultUserId || '');
      const separator = url.includes('?') ? '&' : '?';
      const sseUrlWithUser = userIdParam ? `${url}${separator}user_id=${userIdParam}` : url;
      const eventSource = new EventSource(sseUrlWithUser);
      eventSourceRef.current = eventSource;

      // Connection opened
      eventSource.onopen = () => {
        console.log('SSE connection opened');
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
            connect(url);
          }
        }, 3000);
      };

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      console.log('SSE connection closed');
    }
  }, []);

  const sendMessage = useCallback(async (message, userId = config.defaultUserId) => {
    if (!isConnected) {
      console.warn('Cannot send message: not connected');
      return;
    }

    try {
      // Send message to the agent API
      // Derive API base from SSE URL, ignoring any query params
      const sseUrl = eventSourceRef.current?.url || config.agentUrl;
      let baseUrl = config.agentApiBaseUrl;
      if (!baseUrl && sseUrl) {
        try {
          const parsed = new URL(sseUrl);
          baseUrl = `${parsed.protocol}//${parsed.host}`;
        } catch (_err) {
          // Fallback: strip everything after /sse
          baseUrl = sseUrl.split('/sse')[0];
        }
      }

      const response = await fetch(`${baseUrl}/chat`, {
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

      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [isConnected]);

  return {
    connect,
    disconnect,
    sendMessage,
    isConnected,
    lastMessage,
  };
};
