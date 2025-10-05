// Production environment configuration
export default {
  agentUrl: 'https://mcp-storefront-agent-app.bluesky-3a89aa0f.eastus.azurecontainerapps.io/sse/chat',
  agentApiBaseUrl: 'https://mcp-storefront-agent-app.bluesky-3a89aa0f.eastus.azurecontainerapps.io',
  websocketUrl: 'wss://mcp-storefront-agent-app.bluesky-3a89aa0f.eastus.azurecontainerapps.io/ws/chat',
  appName: 'Chat MFE',
  debug: false,
  defaultUserId: 'prod-user',
  features: {
    useWebSocket: false, // Using SSE instead
    showDebugInfo: false,
    enableLogging: false,
    mockMode: false,
  },
  ui: {
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    showConnectionDetails: false,
  }
};
