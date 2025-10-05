import React from 'react';
import ChatContainer from './components/ChatContainer';
import config from './config/environment';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>{config.appName}</h1>
        <p>Powered by Server-Sent Events</p>
        {config.debug && (
          <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.5rem' }}>
            Environment: {process.env.NODE_ENV} | Agent: {config.agentUrl}
          </div>
        )}
      </header>
      <main className="App-main">
        <ChatContainer />
      </main>
    </div>
  );
}

export default App;
