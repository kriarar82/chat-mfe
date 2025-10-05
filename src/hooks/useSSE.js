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
    console.log('useSSE: lastMessage type:', typeof lastMessage);
    if (lastMessage) {
      try {
        const parsed = JSON.parse(lastMessage);
        console.log('useSSE: parsed lastMessage:', parsed);
      } catch (e) {
        console.log('useSSE: lastMessage is not JSON:', lastMessage);
      }
    }
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
      console.log('sessionid of SSE URL:', currentSessionId);
      
      // Try base SSE URL first (without session ID)
      let sseUrl = url+'/' + currentSessionId;
      console.log('Attempting to connect to base SSE URL:', sseUrl);
      
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;
      
      // Set a connection timeout to prevent UI flipping
      const connectionTimeout = setTimeout(() => {
        if (eventSource.readyState === EventSource.CONNECTING) {
          console.log('Connection timeout - still connecting after 10 seconds');
          // Don't set isConnected to false immediately, let the error handler deal with it
        }
      }, 10000);

      // Connection opened
      eventSource.onopen = () => {
        console.log('SSE connection opened with session:', currentSessionId);
        console.log('SSE URL:', sseUrl);
        console.log('EventSource readyState:', eventSource.readyState);
        clearTimeout(connectionTimeout); // Clear the timeout
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

      // Message received - handle different event types
      eventSource.onmessage = (event) => {
        console.log('SSE message received:', event.data);
        console.log('Event type:', event.type);
        console.log('Event lastEventId:', event.lastEventId);
        setLastMessage(event.data);
      };

      // Handle specific event types that might be sent by the server
      eventSource.addEventListener('message', (event) => {
        console.log('SSE addEventListener message:', event.data);
        setLastMessage(event.data);
      });

      // Handle 'response' event type (as seen in network tab)
      eventSource.addEventListener('response', (event) => {
        console.log('SSE response event received:', event.data);
        console.log('Response event type:', event.type);
        console.log('Response event lastEventId:', event.lastEventId);
        
        try {
          const responseData = JSON.parse(event.data);
          console.log('Parsed response data:', responseData);
          
          // Extract just the response text
          const responseText = responseData.response || 'No response text available';
          console.log('Extracted response text:', responseText);
          
          // Create a clean message object with just the response text
          const cleanMessage = {
            response: responseText,
            success: responseData.success || false,
            session_id: responseData.session_id || sessionId,
            timestamp: Date.now(),
            type: 'agent_response'
          };
          
          console.log('Setting lastMessage with clean response...');
          setLastMessage(JSON.stringify(cleanMessage));
          console.log('lastMessage set successfully');
        } catch (error) {
          console.error('Error parsing response data:', error);
          // Fallback to original data if parsing fails
          setLastMessage(event.data);
        }
      });

      // Handle any custom event types
      eventSource.addEventListener('data', (event) => {
        console.log('SSE data event received:', event.data);
        setLastMessage(event.data);
      });

      // Handle 'chat' event type
      eventSource.addEventListener('chat', (event) => {
        console.log('SSE chat event received:', event.data);
        setLastMessage(event.data);
      });

      // Generic event listener for any event type
      eventSource.addEventListener('open', (event) => {
        console.log('SSE connection opened');
        console.log('EventSource readyState:', eventSource.readyState);
        console.log('EventSource URL:', eventSource.url);
      });

      // Debug: Log all events and catch any unhandled events
      const originalAddEventListener = eventSource.addEventListener;
      eventSource.addEventListener = function(type, listener, options) {
        console.log('Adding event listener for type:', type);
        return originalAddEventListener.call(this, type, (event) => {
          console.log(`Event fired - Type: ${type}, Data:`, event.data);
          listener(event);
        }, options);
      };

      // Add a catch-all listener for any event type
      const catchAllListener = (event) => {
        console.log('CATCH-ALL EVENT LISTENER:', event.type, event.data);
        
        // Only process if it's a response event and we haven't already processed it
        if (event.type === 'response') {
          try {
            const responseData = JSON.parse(event.data);
            console.log('Catch-all parsed response data:', responseData);
            
            // Extract just the response text
            const responseText = responseData.response || 'No response text available';
            console.log('Catch-all extracted response text:', responseText);
            
            // Create a clean message object with just the response text
            const cleanMessage = {
              response: responseText,
              success: responseData.success || false,
              session_id: responseData.session_id || sessionId,
              timestamp: Date.now(),
              type: 'agent_response'
            };
            
            console.log('Catch-all setting lastMessage with clean response...');
            setLastMessage(JSON.stringify(cleanMessage));
            console.log('Catch-all lastMessage set');
          } catch (error) {
            console.error('Catch-all error parsing response data:', error);
            setLastMessage(event.data);
          }
        } else {
          // For non-response events, use original data
          setLastMessage(event.data);
        }
      };

      // Try to add listeners for common event types
      ['message', 'response', 'data', 'chat', 'error', 'open', 'close'].forEach(eventType => {
        try {
          eventSource.addEventListener(eventType, catchAllListener);
          console.log(`Added catch-all listener for: ${eventType}`);
        } catch (e) {
          console.log(`Could not add listener for ${eventType}:`, e.message);
        }
      });

      // Additional debugging: Check if EventSource is receiving data
      const checkForData = () => {
        console.log('Checking EventSource state...');
        console.log('ReadyState:', eventSource.readyState);
        console.log('URL:', eventSource.url);
        
        if (eventSource.readyState === EventSource.OPEN) {
          console.log('EventSource is OPEN and ready to receive data');
        } else if (eventSource.readyState === EventSource.CONNECTING) {
          console.log('EventSource is still CONNECTING...');
        } else if (eventSource.readyState === EventSource.CLOSED) {
          console.log('EventSource is CLOSED');
        }
      };

      // Check immediately and after a delay
      checkForData();
      setTimeout(checkForData, 2000);
      setTimeout(checkForData, 5000);

      // Override the EventSource's internal message handling
      const originalOnMessage = eventSource.onmessage;
      eventSource.onmessage = function(event) {
        console.log('OVERRIDDEN onmessage handler:', event.type, event.data);
        
        // Process response events to extract just the response text
        if (event.type === 'response' || event.data.includes('"response"')) {
          try {
            const responseData = JSON.parse(event.data);
            const responseText = responseData.response || 'No response text available';
            
            const cleanMessage = {
              response: responseText,
              success: responseData.success || false,
              session_id: responseData.session_id || sessionId,
              timestamp: Date.now(),
              type: 'agent_response'
            };
            
            console.log('Overridden handler setting clean response:', responseText);
            setLastMessage(JSON.stringify(cleanMessage));
          } catch (error) {
            console.error('Overridden handler error parsing response:', error);
            setLastMessage(event.data);
          }
        } else {
          setLastMessage(event.data);
        }
        
        if (originalOnMessage) {
          originalOnMessage.call(this, event);
        }
      };

      // Also try to intercept the EventSource's internal event handling
      const originalDispatchEvent = eventSource.dispatchEvent;
      if (originalDispatchEvent) {
        eventSource.dispatchEvent = function(event) {
          console.log('EventSource dispatchEvent intercepted:', event.type, event.data);
          setLastMessage(event.data);
          return originalDispatchEvent.call(this, event);
        };
      }


      // Error occurred
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        console.log('EventSource readyState:', eventSource.readyState);
        clearTimeout(connectionTimeout); // Clear the timeout
        
        // Don't immediately set isConnected to false - let the connection attempt complete
        // Only set to false if the connection is actually closed
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('EventSource is closed, setting disconnected state');
          setIsConnected(false);
        }
        
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
            // Only set disconnected if the connection is actually closed
            if (sessionEventSource.readyState === EventSource.CLOSED) {
              setIsConnected(false);
            }
          };
        } else {
          // Don't auto-reconnect - let user manually retry
          console.log('Connection failed, user can retry manually');
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
