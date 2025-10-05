// Production environment configuration
export default {
  agentUrl: 'https://storefront-agent-api.kindflower-89fe6492.eastus.azurecontainerapps.io/sse/chat',
  agentApiBaseUrl: 'https://storefront-agent-api.kindflower-89fe6492.eastus.azurecontainerapps.io',
  websocketUrl: 'wss://storefront-agent-api.kindflower-89fe6492.eastus.azurecontainerapps.io/ws/chat',
  appName: 'Chat MFE',
  debug: false,
  defaultUserId: 'prod-user',
  features: {
    useWebSocket: true,
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
