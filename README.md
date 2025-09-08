# Chat Microfrontend (MFE)

A modern React-based chat microfrontend that communicates with an AI agent using Server-Sent Events (SSE) for real-time communication.

## Features

- 🚀 **Modern React UI** - Clean, responsive design with smooth animations
- 📡 **Server-Sent Events** - Real-time communication without WebSocket complexity
- 💬 **Real-time Chat** - Instant message delivery and display
- 🔌 **Flexible Connection** - Connect to any agent URL
- 📱 **Mobile Responsive** - Works perfectly on all device sizes
- 🎨 **Beautiful Design** - Gradient backgrounds and modern UI components
- ⚡ **Auto-reconnection** - Automatically reconnects on connection loss

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd chat-mfe
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Usage

### Connecting to an Agent

1. Enter the agent URL in the connection field (e.g., `http://localhost:3001/sse`)
2. Click "Connect" to establish the SSE connection
3. Start chatting! Your messages will be sent to the agent via HTTP POST requests
4. Agent responses will be received in real-time via Server-Sent Events

### Message Types

- **User Messages** - Messages you send (appear on the right, blue gradient)
- **Agent Messages** - Responses from the agent (appear on the left, gray background)
- **System Messages** - Connection status and error messages (centered, yellow background)

## Architecture

### Components

- **ChatContainer** - Main container managing state and SSE connection
- **MessageList** - Displays all messages with auto-scroll
- **Message** - Individual message component with sender identification
- **MessageInput** - Text input with auto-resize and keyboard shortcuts
- **ConnectionStatus** - Visual indicator of connection state

### SSE Implementation

The application uses a custom `useSSE` hook that:
- Establishes EventSource connection to the agent
- Handles connection state management
- Provides auto-reconnection on connection loss
- Manages message sending via HTTP POST requests

### Message Flow

1. User types message and presses Enter
2. Message is added to local state immediately
3. Message is sent to agent via HTTP POST to `/api/send-message`
4. Agent processes message and sends response via SSE
5. Response is received and displayed in real-time

## Agent Integration

To integrate with your agent, ensure it supports:

1. **SSE Endpoint** - Sends messages via Server-Sent Events
2. **HTTP POST Endpoint** - Receives messages at `/api/send-message`

### Expected Agent Response Format

The agent should send messages in one of these formats:

**JSON Format:**
```json
{
  "content": "Hello! How can I help you?",
  "message": "Hello! How can I help you?"
}
```

**Plain Text Format:**
```
Hello! How can I help you?
```

## Customization

### Styling

All components use CSS modules for styling. You can customize:
- Colors in component CSS files
- Gradients in `App.css` and `ChatContainer.css`
- Animations and transitions
- Responsive breakpoints

### Configuration

- Update the default agent URL in `ChatContainer.js`
- Modify SSE reconnection timeout in `useSSE.js`
- Adjust message sending endpoint in `useSSE.js`

## Building for Production

```bash
npm run build
```

This builds the app for production to the `build` folder.

## Deployment

The built files can be deployed to any static hosting service:
- Vercel
- Netlify
- AWS S3
- GitHub Pages

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Troubleshooting

### Connection Issues

- Ensure the agent URL is correct and accessible
- Check that the agent supports CORS for your domain
- Verify the agent is running and accepting SSE connections

### Message Not Sending

- Check browser console for errors
- Verify the agent's HTTP POST endpoint is working
- Ensure the message format matches agent expectations

### Styling Issues

- Clear browser cache
- Check for CSS conflicts
- Verify all CSS files are loading correctly
