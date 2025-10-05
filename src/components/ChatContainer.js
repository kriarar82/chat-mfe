import React, { useState, useEffect, useRef } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ConnectionStatus from './ConnectionStatus';
import { useSSE } from '../hooks/useSSE';
import config from '../config/environment';
import './ChatContainer.css';

const ChatContainer = () => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  // SSE hook for real-time communication
  const { 
    connect, 
    disconnect, 
    sendMessage, 
    isConnected: sseConnected,
    lastMessage 
  } = useSSE();

  // Update connection status
  useEffect(() => {
    setIsConnected(sseConnected);
  }, [sseConnected]);

  // Handle incoming messages from SSE
  useEffect(() => {
    if (lastMessage) {
      try {
        const messageData = JSON.parse(lastMessage);
        setMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          text: messageData.content || messageData.message || lastMessage,
          sender: 'agent',
          timestamp: new Date().toISOString()
        }]);
      } catch (error) {
        // If not JSON, treat as plain text
        setMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          text: lastMessage,
          sender: 'agent',
          timestamp: new Date().toISOString()
        }]);
      }
    }
  }, [lastMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-connect to agent on component mount
  useEffect(() => {
    connect(config.agentUrl);
  }, [connect]);

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    // Add user message to the list
    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    // Send message to agent via SSE
    if (isConnected) {
      const userId = config.defaultUserId;
      sendMessage(messageText, userId);
    } else {
      // If not connected, show error message
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        text: 'Not connected to agent. Please check the connection.',
        sender: 'system',
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const handleConnect = () => {
    connect(config.agentUrl);
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Chat with Agent</h2>
        <div className="connection-controls">
          <div className="agent-info">
            <span className="agent-url">{config.agentUrl}</span>
          </div>
          {!isConnected ? (
            <button onClick={handleConnect} className="connect-btn">
              Connect to Agent
            </button>
          ) : (
            <button onClick={handleDisconnect} className="disconnect-btn">
              Disconnect
            </button>
          )}
        </div>
      </div>

      <ConnectionStatus isConnected={isConnected} />

      <MessageList messages={messages} messagesEndRef={messagesEndRef} />

      <div className="chat-controls">
        <button onClick={clearMessages} className="clear-btn">
          Clear Messages
        </button>
      </div>

      <MessageInput 
        onSendMessage={handleSendMessage}
        disabled={!isConnected}
      />
    </div>
  );
};

export default ChatContainer;
