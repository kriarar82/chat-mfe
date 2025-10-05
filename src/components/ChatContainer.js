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
  const { connect, disconnect, sendMessage, isConnected: transportConnected, lastMessage, sessionId } = transport;

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

          // Create a clean response message with just the response text
          let responseText = incomingText;
          
          // Only add error details if there's an error and it's not just a general guidance message
          if (error && !success && !error.includes('general greeting') && !error.includes('no actionable request')) {
            responseText += `\n\n**Error:** ${error}`;
          }

          setMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            text: responseText,
            sender: 'agent',
            timestamp: new Date().toISOString(),
            success: success,
            sessionId: sessionId,
            mcpDetails: mcpDetails
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

          // Use clean response text
          const responseText = incomingText;

          setMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            text: responseText,
            sender: 'agent',
            timestamp: new Date().toISOString()
          }]);
        }
      } catch (error) {
        // Fallback to plain text if it's not an echo of the user's message
        if (typeof lastMessage === 'string' && lastMessage.trim() === lastUserMessageRef.current.trim()) return;
        
        // Use the message as-is if it's not JSON
        const responseText = lastMessage;
        
        setMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          text: responseText,
          sender: 'agent',
          timestamp: new Date().toISOString()
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


  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>AI Chat Assistant</h2>
        <div className="connection-status">
          <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          {sessionId && (
            <div className="session-info">
              <span className="session-label">Session:</span>
              <span className="session-id">{sessionId}</span>
            </div>
          )}
        </div>
      </div>

      <div className="chat-main">
        {!isConnected ? (
          <div className="welcome-message">
            <div className="welcome-content">
              <div className="welcome-icon">💬</div>
              <h3>Welcome to AI Chat Assistant</h3>
              <p>Start a conversation with our intelligent AI agent. Get instant responses to your questions and explore our advanced features.</p>
              <div className="welcome-features">
                <div className="feature">
                  <span className="feature-icon">🚀</span>
                  <div className="feature-text">
                    <span className="feature-title">Instant Responses</span>
                    <span className="feature-desc">Get immediate answers</span>
                  </div>
                </div>
                <div className="feature">
                  <span className="feature-icon">🔍</span>
                  <div className="feature-text">
                    <span className="feature-title">Smart Search</span>
                    <span className="feature-desc">Intelligent query processing</span>
                  </div>
                </div>
                <div className="feature">
                  <span className="feature-icon">💡</span>
                  <div className="feature-text">
                    <span className="feature-title">AI Powered</span>
                    <span className="feature-desc">Advanced AI technology</span>
                  </div>
                </div>
                <div className="feature">
                  <span className="feature-icon">🔒</span>
                  <div className="feature-text">
                    <span className="feature-title">Secure Chat</span>
                    <span className="feature-desc">Privacy protected</span>
                  </div>
                </div>
              </div>
              <button onClick={handleStartChat} className="start-chat-btn">
                <span className="btn-icon">🚀</span>
                Start Conversation
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="chat-messages">
              <MessageList messages={messages} messagesEndRef={messagesEndRef} isWaitingForAgent={isWaitingForAgent} />
            </div>
            <div className="chat-controls">
              <button onClick={handleEndChat} className="end-chat-btn">
                <span className="btn-icon">🔚</span>
                End Chat
              </button>
            </div>
            <MessageInput 
              onSendMessage={handleSendMessage}
              disabled={!isConnected}
            />
          </>
        )}
      </div>

      <div className="chat-footer">
        <div className="footer-content">
          <p>Created by <a href="https://www.linkedin.com/in/krishna-kumar-neelakanta-ba0a9562/" target="_blank" rel="noopener noreferrer" className="footer-link">Krishna Kumar Neelakanta</a></p>
          <div className="footer-links">
            <a href="https://www.linkedin.com/in/krishna-kumar-neelakanta-ba0a9562/" target="_blank" rel="noopener noreferrer" className="social-link">
              <span className="social-icon">💼</span>
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
