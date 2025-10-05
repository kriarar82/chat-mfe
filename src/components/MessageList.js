import React from 'react';
import Message from './Message';
import './MessageList.css';

const MessageList = ({ messages, messagesEndRef, isWaitingForAgent }) => {
  return (
    <div className="message-list">
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <Message key={message.id} message={message} />
          ))
        )}
        {isWaitingForAgent && (
          <div className="message agent-message">
            <div className="message-content">
              <div className="typing-indicator">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="typing-text">Agent is typing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;
