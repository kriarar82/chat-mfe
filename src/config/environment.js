// Environment configuration for Chat MFE
import devConfig from './environments/development';
import stagingConfig from './environments/staging';
import prodConfig from './environments/production';

const config = {
  development: devConfig,
  staging: stagingConfig,
  production: prodConfig
};

// Get current environment
const getCurrentEnvironment = () => {
  return process.env.NODE_ENV || 'development';
};

// Get configuration for current environment
const getConfig = () => {
  const env = getCurrentEnvironment();
  const baseConfig = config[env] || config.development;
  
  // Merge with environment variables if they exist
  return {
    ...baseConfig,
    agentUrl: process.env.REACT_APP_AGENT_URL || baseConfig.agentUrl,
    agentApiBaseUrl: process.env.REACT_APP_AGENT_API_BASE_URL || baseConfig.agentApiBaseUrl,
    appName: process.env.REACT_APP_APP_NAME || baseConfig.appName,
    debug: process.env.REACT_APP_DEBUG === 'true' ? true : process.env.REACT_APP_DEBUG === 'false' ? false : baseConfig.debug,
    defaultUserId: process.env.REACT_APP_DEFAULT_USER_ID || baseConfig.defaultUserId,
    features: {
      ...baseConfig.features,
      showDebugInfo: process.env.REACT_APP_SHOW_DEBUG_INFO === 'true' ? true : process.env.REACT_APP_SHOW_DEBUG_INFO === 'false' ? false : baseConfig.features.showDebugInfo,
      enableLogging: process.env.REACT_APP_ENABLE_LOGGING === 'true' ? true : process.env.REACT_APP_ENABLE_LOGGING === 'false' ? false : baseConfig.features.enableLogging,
    },
    ui: {
      ...baseConfig.ui,
      primaryColor: process.env.REACT_APP_PRIMARY_COLOR || baseConfig.ui.primaryColor,
      secondaryColor: process.env.REACT_APP_SECONDARY_COLOR || baseConfig.ui.secondaryColor,
    }
  };
};

// Export configuration
export default getConfig();

// Export individual functions for convenience
export { getCurrentEnvironment, getConfig };
