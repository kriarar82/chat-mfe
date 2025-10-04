# Azure Container Apps Deployment Guide

This guide will help you deploy the Chat Microfrontend to Azure Container Apps.

## Prerequisites

1. **Azure CLI** installed and configured
   ```bash
   # Install Azure CLI (if not already installed)
   # macOS: brew install azure-cli
   # Windows: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
   
   # Login to Azure
   az login
   ```

2. **Docker** installed locally (for testing)

## Quick Deployment (Automated)

Run the automated deployment script:

```bash
./azure-deploy.sh
```

This script will:
- Create a resource group
- Create an Azure Container Registry
- Build and push the Docker image
- Create a Container Apps environment
- Deploy the application
- Provide you with the public URL

## Manual Deployment Steps

### 1. Set Configuration Variables

```bash
RESOURCE_GROUP="chat-mfe-rg"
LOCATION="eastus"
CONTAINER_APP_NAME="chat-mfe"
CONTAINER_APP_ENVIRONMENT="chat-mfe-env"
ACR_NAME="chatmfeacr"
IMAGE_NAME="chat-mfe"
IMAGE_TAG="latest"
```

### 2. Create Resource Group

```bash
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION
```

### 3. Create Azure Container Registry

```bash
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true
```

### 4. Build and Push Docker Image

```bash
# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query loginServer --output tsv)

# Build and push
az acr build \
  --registry $ACR_NAME \
  --image $IMAGE_NAME:$IMAGE_TAG \
  --file Dockerfile \
  .
```

### 5. Create Container Apps Environment

```bash
az containerapp env create \
  --name $CONTAINER_APP_ENVIRONMENT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION
```

### 6. Deploy Container App

```bash
az containerapp create \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_APP_ENVIRONMENT \
  --image $ACR_LOGIN_SERVER/$IMAGE_NAME:$IMAGE_TAG \
  --target-port 80 \
  --ingress external \
  --registry-server $ACR_LOGIN_SERVER
```

### 7. Get Application URL

```bash
az containerapp show \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn \
  --output tsv
```

## Testing Locally

Before deploying to Azure, you can test the Docker container locally:

```bash
# Build the image
docker build -t chat-mfe .

# Run the container
docker run -p 8080:80 chat-mfe

# Test in browser
open http://localhost:8080
```

## Updating the Application

To update your deployed application:

```bash
# Build and push new image
az acr build \
  --registry $ACR_NAME \
  --image $IMAGE_NAME:$IMAGE_TAG \
  --file Dockerfile \
  .

# Update the container app
az containerapp update \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --image $ACR_LOGIN_SERVER/$IMAGE_NAME:$IMAGE_TAG
```

## Monitoring and Logs

### View Application Logs

```bash
az containerapp logs show \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --follow
```

### Check Application Status

```bash
az containerapp show \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress
```

## Scaling

### Scale Up/Down

```bash
az containerapp update \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --min-replicas 1 \
  --max-replicas 10
```

## Cleanup

To remove all resources and avoid charges:

```bash
az group delete --name $RESOURCE_GROUP --yes --no-wait
```

## Troubleshooting

### Common Issues

1. **Image pull errors**: Ensure the ACR credentials are correct
2. **Port configuration**: Make sure the target port is 80
3. **Ingress issues**: Verify the ingress is set to external
4. **Resource limits**: Check if you have sufficient quotas

### Health Checks

The application includes a health check endpoint at `/health` that returns "healthy" when the app is running.

### Logs

Check the application logs for any runtime errors:

```bash
az containerapp logs show \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP
```

## Cost Optimization

- Use the Basic SKU for ACR (sufficient for this app)
- Set appropriate resource limits
- Consider using spot instances for development
- Monitor usage in the Azure portal

## Security Considerations

- The app runs on HTTP (port 80) - consider adding HTTPS
- No authentication is implemented - add if needed
- CORS is configured for development - restrict for production
- Consider using Azure Key Vault for secrets

## Next Steps

1. Set up a custom domain
2. Configure HTTPS/TLS
3. Set up monitoring and alerts
4. Implement CI/CD pipeline
5. Add authentication if required
