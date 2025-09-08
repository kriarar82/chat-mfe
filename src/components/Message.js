import React from 'react';
import './Message.css';

const Message = ({ message }) => {
  const { text, sender, timestamp } = message;
  
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getSenderDisplayName = (sender) => {
    switch (sender) {
      case 'user':
        return 'You';
      case 'agent':
        return 'Agent';
      case 'system':
        return 'System';
      default:
        return sender;
    }
  };

  return (
    <div className={`message ${sender}`}>
      <div className="message-content">
        <div className="message-header">
          <span className="sender-name">{getSenderDisplayName(sender)}</span>
          <span className="message-time">{formatTime(timestamp)}</span>
        </div>
        <div className="message-text">{text}</div>
      </div>
    </div>
  );
};

export default Message;
