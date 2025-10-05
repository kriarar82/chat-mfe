# Environment Configuration Guide

This document explains how to configure the Chat MFE for different environments.

## Configuration Structure

The application uses a hierarchical configuration system:

1. **Base Configuration**: Environment-specific files in `src/config/environments/`
2. **Environment Variables**: Override base configuration via `.env` files
3. **Runtime Configuration**: Final merged configuration

## Environment Files

### Development (`src/config/environments/development.js`)
- **Agent URL**: `http://localhost:3001/sse`
- **Debug Mode**: Enabled
- **Features**: Debug info, logging enabled
- **UI**: Shows connection details

### Staging (`src/config/environments/staging.js`)
- **Agent URL**: `https://storefront-agent-api.kindflower-89fe6492.eastus.azurecontainerapps.io/sse/chat`
- **Debug Mode**: Disabled
- **Features**: Logging enabled, no debug info
- **UI**: Shows connection details

### Production (`src/config/environments/production.js`)
- **Agent URL**: `https://storefront-agent-api.kindflower-89fe6492.eastus.azurecontainerapps.io/sse/chat`
- **Debug Mode**: Disabled
- **Features**: Minimal logging, no debug info
- **UI**: Clean interface

## Environment Variables

Create a `.env.local` file in the project root to override configuration:

```bash
# Agent Configuration
REACT_APP_AGENT_URL=https://your-agent-api.com/sse/chat
REACT_APP_AGENT_API_BASE_URL=https://your-agent-api.com

# Application Configuration
REACT_APP_APP_NAME=My Chat MFE
REACT_APP_DEBUG=true
REACT_APP_DEFAULT_USER_ID=my-user-123

# Feature Flags
REACT_APP_SHOW_DEBUG_INFO=true
REACT_APP_ENABLE_LOGGING=true

# UI Customization
REACT_APP_PRIMARY_COLOR=#667eea
REACT_APP_SECONDARY_COLOR=#764ba2
```

## Configuration Properties

### Core Configuration
- `agentUrl`: SSE endpoint for real-time communication
- `agentApiBaseUrl`: Base URL for API calls
- `appName`: Application display name
- `debug`: Enable debug mode
- `defaultUserId`: Default user ID for messages

### Features
- `showDebugInfo`: Show debug information in UI
- `enableLogging`: Enable console logging
- `mockMode`: Enable mock mode (future feature)

### UI
- `primaryColor`: Primary theme color
- `secondaryColor`: Secondary theme color
- `showConnectionDetails`: Show connection details in UI

## Usage in Components

```javascript
import config from '../config/environment';

// Use configuration
const agentUrl = config.agentUrl;
const isDebug = config.debug;
const appName = config.appName;
```

## Environment Detection

The application automatically detects the environment based on `NODE_ENV`:

- `development`: Uses development configuration
- `staging`: Uses staging configuration  
- `production`: Uses production configuration

## Docker Configuration

For Docker deployments, set environment variables in your Dockerfile or docker-compose.yml:

```dockerfile
ENV REACT_APP_AGENT_URL=https://your-agent-api.com/chat
ENV REACT_APP_APP_NAME=Production Chat MFE
ENV REACT_APP_DEBUG=false
```

## Azure Container Apps

For Azure Container Apps, set environment variables in your deployment:

```bash
az containerapp update \
  --name chat-mfe \
  --resource-group chat-mfe-rg \
  --set-env-vars \
    REACT_APP_AGENT_URL=https://your-agent-api.com/chat \
    REACT_APP_APP_NAME=Production Chat MFE \
    REACT_APP_DEBUG=false
```

## Configuration Validation

The application validates configuration on startup and logs any issues:

- Missing required configuration
- Invalid URLs
- Configuration conflicts

## Best Practices

1. **Never commit `.env.local`** - Add to `.gitignore`
2. **Use environment-specific files** for base configuration
3. **Override with environment variables** for deployment-specific settings
4. **Test all environments** before deployment
5. **Document custom configurations** for your team

## Troubleshooting

### Common Issues

1. **Configuration not loading**: Check file paths and imports
2. **Environment variables not working**: Ensure they start with `REACT_APP_`
3. **Wrong environment detected**: Check `NODE_ENV` value
4. **Agent connection issues**: Verify `agentUrl` configuration

### Debug Mode

Enable debug mode to see:
- Current environment
- Agent URL being used
- Configuration values
- Connection status details

```bash
REACT_APP_DEBUG=true npm start
```
