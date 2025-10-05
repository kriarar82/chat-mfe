import { useState, useCallback, useRef, useEffect } from 'react';
import config from '../config/environment';

export const useSSE = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const eventSourceRef = useRef(null);

  // Debug lastMessage changes
  useEffect(() => {
    console.log('useSSE: lastMessage state changed to:', lastMessage);
  }, [lastMessage]);

  // Generate a unique session ID
  const generateSessionId = useCallback(() => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }, []);

  const connect = useCallback((url, sessionIdParam = null) => {
    try {
      // Ensure only one session is active - close existing connection if any
      if (eventSourceRef.current) {
        console.log('Closing existing SSE connection before starting new one');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setIsConnected(false);
        setLastMessage(null);
      }

      // Generate or use provided session ID
      const currentSessionId = sessionIdParam || generateSessionId();
      setSessionId(currentSessionId);
      url = url + '/' + currentSessionId;
      console.log('sessionid of SSE URL:', currentSessionId);
      
      // Try base SSE URL first (without session ID)
      let sseUrl = url;
      console.log('Attempting to connect to base SSE URL:', sseUrl);
      
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      // Connection opened
      eventSource.onopen = () => {
        console.log('SSE connection opened with session:', currentSessionId);
        console.log('SSE URL:', sseUrl);
        setIsConnected(true);
        
        // Send session created message to chat
        console.log('SSE connection established successfully');
        setLastMessage(JSON.stringify({
          response: `Session created: ${currentSessionId}`,
          success: true,
          session_id: currentSessionId,
          timestamp: Date.now(),
          type: 'session_created'
        }));
      };

      // Message received
      eventSource.onmessage = (event) => {
        console.log('SSE message received:', event.data);
        setLastMessage(event.data);
      };


      // Error occurred
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        console.log('EventSource readyState:', eventSource.readyState);
        setIsConnected(false);
        
        // If base URL failed, try session-based URL as fallback
        if (!sseUrl.includes('/' + currentSessionId)) {
          console.log('Base URL failed, trying session-based URL...');
          const sessionUrl = `${url}/${currentSessionId}`;
          console.log('Trying session URL:', sessionUrl);
          
          // Close current connection
          eventSource.close();
          
          // Try session-based URL
          const sessionEventSource = new EventSource(sessionUrl);
          eventSourceRef.current = sessionEventSource;
          
          sessionEventSource.onopen = () => {
            console.log('SSE connection opened with session URL');
            setIsConnected(true);
            setLastMessage(JSON.stringify({
              response: `Session created: ${currentSessionId}`,
              success: true,
              session_id: currentSessionId,
              timestamp: Date.now(),
              type: 'session_created'
            }));
          };
          
          sessionEventSource.onmessage = (event) => {
            console.log('SSE message received from session URL:', event.data);
            setLastMessage(event.data);
          };
          
          sessionEventSource.onerror = (sessionError) => {
            console.error('Session URL SSE connection error:', sessionError);
            setIsConnected(false);
          };
        } else {
          // Attempt to reconnect after 3 seconds
          setTimeout(() => {
            if (eventSource.readyState === EventSource.CLOSED) {
              console.log('Attempting to reconnect...');
              connect(url, currentSessionId);
            }
          }, 3000);
        }
      };

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      setIsConnected(false);
    }
  }, [generateSessionId]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('Disconnecting SSE connection...');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      setLastMessage(null);
      setSessionId(null);
      console.log('SSE connection closed and cleaned up');
    }
  }, []);

  const sendMessage = useCallback(async (message, userId = config.defaultUserId) => {
    if (!isConnected) {
      console.warn('Cannot send message: not connected');
      return;
    }

    try {
      // Send message to the appropriate endpoint
      const baseUrl = config.agentApiBaseUrl;
      let messageUrl;
      
      // Check if we're using session-based connection
      const currentEventSource = eventSourceRef.current;
      if (currentEventSource && currentEventSource.url && currentEventSource.url.includes('/' + sessionId)) {
        // Session-based connection - use session endpoint
        messageUrl = `${baseUrl}/sse/chat/${sessionId}/message`;
      } else {
        // Base connection - use base endpoint
        messageUrl = `${baseUrl}/chat`;
      }

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
        const errorText = await response.text();
        throw new Error(`Failed to send message: ${response.status} ${errorText}`);
      }

      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
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
