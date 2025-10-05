// Staging environment configuration
export default {
  agentUrl: 'https://storefront-agent-api.kindflower-89fe6492.eastus.azurecontainerapps.io/sse/chat',
  agentApiBaseUrl: 'https://storefront-agent-api.kindflower-89fe6492.eastus.azurecontainerapps.io',
  appName: 'Chat MFE (Staging)',
  debug: false,
  defaultUserId: 'staging-user',
  features: {
    showDebugInfo: false,
    enableLogging: true,
    mockMode: false,
  },
  ui: {
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    showConnectionDetails: true,
  }
};
