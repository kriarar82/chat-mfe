import React, { useState, useEffect, useRef } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useSSE } from '../hooks/useSSE';
import { useWebSocket } from '../hooks/useWebSocket';
import config from '../config/environment';
import './ChatContainer.css';

const ChatContainer = () => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isWaitingForAgent, setIsWaitingForAgent] = useState(false);
  const messagesEndRef = useRef(null);
  const lastUserMessageRef = useRef('');

  // Choose transport based on feature flag
  const sse = useSSE();
  const ws = useWebSocket();
  const transport = config.features.useWebSocket ? ws : sse;
  const { connect, disconnect, sendMessage, reinitialize, isConnected: transportConnected, lastMessage, sessionId } = transport;

  // Update connection status
  useEffect(() => {
    setIsConnected(transportConnected);
  }, [transportConnected]);

  // Handle incoming messages from SSE
  useEffect(() => {
    if (lastMessage) {
      console.log('Received lastMessage:', lastMessage);
      try {
        const messageData = JSON.parse(lastMessage);
        console.log('Parsed messageData:', messageData);
        
        // Handle the new response format
        if (messageData.response !== undefined) {
          const incomingText = messageData.response;
          const sessionId = messageData.session_id;
          const success = messageData.success;
          const error = messageData.error;
          const mcpDetails = messageData.mcp_details;

          // Create a comprehensive response message with raw JSON
          let responseText = `**Response:** ${incomingText}`;
          
          if (error && !success) {
            responseText += `\n\n**Error Details:** ${error}`;
          }
          if (mcpDetails && mcpDetails.error) {
            responseText += `\n\n**MCP Details:** ${mcpDetails.error}`;
          }

          // Add raw JSON response for debugging
          responseText += `\n\n**Raw JSON Response:**\n\`\`\`json\n${JSON.stringify(messageData, null, 2)}\n\`\`\``;

          setMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            text: responseText,
            sender: 'agent',
            timestamp: new Date().toISOString(),
            success: success,
            sessionId: sessionId,
            mcpDetails: mcpDetails,
            rawResponse: messageData
          }]);
        } else {
          // Fallback to old format handling
          const incomingText =
            messageData.response ||
            (messageData.data && messageData.data.response) ||
            messageData.content ||
            messageData.message ||
            lastMessage;
          const incomingSender = messageData.sender || messageData.role || 'agent';

          // Ignore echoes/user events
          if (incomingSender === 'user' || incomingSender === 'system') return;
          if (typeof incomingText === 'string' && incomingText.trim() === lastUserMessageRef.current.trim()) return;

          // Add raw JSON for debugging in fallback case too
          const responseText = `**Response:** ${incomingText}\n\n**Raw JSON Response:**\n\`\`\`json\n${JSON.stringify(messageData, null, 2)}\n\`\`\``;

          setMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            text: responseText,
            sender: 'agent',
            timestamp: new Date().toISOString(),
            rawResponse: messageData
          }]);
        }
      } catch (error) {
        // Fallback to plain text if it's not an echo of the user's message
        if (typeof lastMessage === 'string' && lastMessage.trim() === lastUserMessageRef.current.trim()) return;
        
        // Show raw message for debugging
        const responseText = `**Raw Message (Not JSON):**\n\`\`\`\n${lastMessage}\n\`\`\``;
        
        setMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          text: responseText,
          sender: 'agent',
          timestamp: new Date().toISOString(),
          rawResponse: { rawMessage: lastMessage, parseError: error.message }
        }]);
      }
      setIsWaitingForAgent(false);
    }
  }, [lastMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Don't auto-connect on component mount - user must click "Start Chat"

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    console.log('Sending message:', messageText);
    console.log('Current connection status:', transportConnected);

    // Add user message to the list
    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    lastUserMessageRef.current = messageText;
    setIsWaitingForAgent(true);

    console.log('Set isWaitingForAgent to true');

    // Send message via active transport
    const userId = config.defaultUserId;
    try {
      await sendMessage(messageText, userId);
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      setIsWaitingForAgent(false);
    }
  };


  const clearMessages = () => {
    setMessages([]);
  };

  const handleStartChat = () => {
    console.log('Starting chat session...');
    if (config.features.useWebSocket) {
      connect(config.websocketUrl);
    } else {
      connect(config.agentUrl);
    }
  };

  const handleEndChat = () => {
    console.log('Ending chat session...');
    if (disconnect) {
      disconnect();
    }
    // Clear existing messages
    setMessages([]);
    setIsWaitingForAgent(false);
  };

  const handleReinitialize = () => {
    if (reinitialize) {
      reinitialize();
      // Reconnect with new session
      if (config.features.useWebSocket) {
        connect(config.websocketUrl);
      } else {
        connect(config.agentUrl);
      }
      // Clear existing messages
      setMessages([]);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Chat with Agent</h2>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          {sessionId && (
            <div className="session-info">
              <span className="session-label">Session:</span>
              <span className="session-id">{sessionId}</span>
            </div>
          )}
        </div>
      </div>

      {!isConnected ? (
        <div className="welcome-message">
          <div className="welcome-content">
            <h3>Welcome to Chat MFE</h3>
            <p>Click "Start Chat" to begin a conversation with the agent.</p>
            <div className="welcome-features">
              <div className="feature">
                <span className="feature-icon">💬</span>
                <span>Real-time chat with AI agent</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🔄</span>
                <span>Session-based conversations</span>
              </div>
              <div className="feature">
                <span className="feature-icon">📊</span>
                <span>Detailed response analysis</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <MessageList messages={messages} messagesEndRef={messagesEndRef} isWaitingForAgent={isWaitingForAgent} />
      )}

      <div className="chat-controls">
        {!isConnected ? (
          <button onClick={handleStartChat} className="start-chat-btn">
            Start Chat
          </button>
        ) : (
          <>
            <button onClick={handleEndChat} className="end-chat-btn">
              End Chat
            </button>
            <button onClick={clearMessages} className="clear-btn">
              Clear Messages
            </button>
            {!config.features.useWebSocket && (
              <button onClick={handleReinitialize} className="reinitialize-btn">
                New Session
              </button>
            )}
          </>
        )}
      </div>

      <MessageInput 
        onSendMessage={handleSendMessage}
        disabled={!isConnected}
      />
    </div>
  );
};

export default ChatContainer;
