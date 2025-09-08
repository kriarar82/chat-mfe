import React from 'react';
import ChatContainer from './components/ChatContainer';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Chat Microfrontend</h1>
        <p>Powered by Server-Sent Events</p>
      </header>
      <main className="App-main">
        <ChatContainer />
      </main>
    </div>
  );
}

export default App;
