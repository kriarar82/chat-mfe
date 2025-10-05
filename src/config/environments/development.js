// Development environment configuration
export default {
  agentUrl: 'https://mcp-storefront-agent-app.bluesky-3a89aa0f.eastus.azurecontainerapps.io/sse/chat',
  agentApiBaseUrl: 'https://mcp-storefront-agent-app.bluesky-3a89aa0f.eastus.azurecontainerapps.io',
  websocketUrl: 'wss://mcp-storefront-agent-app.bluesky-3a89aa0f.eastus.azurecontainerapps.io/ws/chat',
  appName: 'Chat MFE (Development)',
  debug: true,
  defaultUserId: 'dev-user',
  features: {
    useWebSocket: false, // Using SSE instead
    showDebugInfo: true,
    enableLogging: true,
    mockMode: false,
  },
  ui: {
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    showConnectionDetails: true,
  }
};
