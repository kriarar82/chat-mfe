import React from 'react';
import './ConnectionStatus.css';

const ConnectionStatus = ({ isConnected }) => {
  return (
    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
      <div className="status-indicator">
        <div className="status-dot"></div>
        <span className="status-text">
          {isConnected ? 'Connected to Agent' : 'Disconnected'}
        </span>
      </div>
    </div>
  );
};

export default ConnectionStatus;
