import React from 'react';
import './Message.css';

const Message = ({ message }) => {
  const { text, sender, timestamp, success, sessionId, mcpDetails } = message;
  
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

  const getStatusIcon = () => {
    if (sender === 'agent' && success !== undefined) {
      return success ? '✅' : '❌';
    }
    return null;
  };

  const getStatusClass = () => {
    if (sender === 'agent' && success !== undefined) {
      return success ? 'success' : 'error';
    }
    return '';
  };

  const formatMessageText = (text) => {
    if (!text) return '';
    
    return text
      // Convert **text** to <strong>text</strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert ```json\n...\n``` to <pre><code class="json">...</code></pre>
      .replace(/```json\n([\s\S]*?)\n```/g, '<pre><code class="json">$1</code></pre>')
      // Convert ```\n...\n``` to <pre><code>...</code></pre>
      .replace(/```\n([\s\S]*?)\n```/g, '<pre><code>$1</code></pre>')
      // Convert \n\n to <br><br>
      .replace(/\n\n/g, '<br><br>')
      // Convert \n to <br>
      .replace(/\n/g, '<br>');
  };

  return (
    <div className={`message ${sender} ${getStatusClass()}`}>
      <div className="message-content">
        <div className="message-header">
          <span className="sender-name">
            {getSenderDisplayName(sender)}
            {getStatusIcon()}
          </span>
          <span className="message-time">{formatTime(timestamp)}</span>
        </div>
        <div className="message-text" dangerouslySetInnerHTML={{ __html: formatMessageText(text) }}></div>
        {sessionId && (
          <div className="message-meta">
            <span className="session-info">Session: {sessionId}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
