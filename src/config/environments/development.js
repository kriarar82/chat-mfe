// Development environment configuration
export default {
  agentUrl: 'http://localhost:3001/sse',
  agentApiBaseUrl: 'http://localhost:3001',
  appName: 'Chat MFE (Development)',
  debug: true,
  defaultUserId: 'dev-user',
  features: {
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
