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
  const { connect, disconnect, sendMessage, isConnected: transportConnected, lastMessage } = transport;

  // Update connection status
  useEffect(() => {
    setIsConnected(transportConnected);
  }, [transportConnected]);

  // Handle incoming messages from SSE
  useEffect(() => {
    if (lastMessage) {
      try {
        const messageData = JSON.parse(lastMessage);
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

        setMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          text: incomingText,
          sender: 'agent',
          timestamp: new Date().toISOString()
        }]);
      } catch (error) {
        // Fallback to plain text if it's not an echo of the user's message
        if (typeof lastMessage === 'string' && lastMessage.trim() === lastUserMessageRef.current.trim()) return;
        setMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          text: lastMessage,
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

  // Auto-connect to agent on component mount
  useEffect(() => {
    if (config.features.useWebSocket) {
      connect(config.websocketUrl);
    } else {
      connect(config.agentUrl);
    }
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
    lastUserMessageRef.current = messageText;
    setIsWaitingForAgent(true);

    // Send message via active transport
    const userId = config.defaultUserId;
    sendMessage(messageText, userId);
  };


  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Chat with Agent</h2>
      </div>

      <MessageList messages={messages} messagesEndRef={messagesEndRef} isWaitingForAgent={isWaitingForAgent} />

      <div className="chat-controls">
        <button onClick={clearMessages} className="clear-btn">
          Clear Messages
        </button>
      </div>

      <MessageInput 
        onSendMessage={handleSendMessage}
        disabled={false}
      />
    </div>
  );
};

export default ChatContainer;
