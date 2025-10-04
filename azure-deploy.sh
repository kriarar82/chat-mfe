#!/bin/bash

# Azure Container Apps Deployment Script for Chat MFE
# Make sure you're logged in to Azure CLI: az login

set -e

# Configuration variables
RESOURCE_GROUP="chat-mfe-rg"
LOCATION="eastus"
CONTAINER_APP_NAME="chat-mfe"
CONTAINER_APP_ENVIRONMENT="chat-mfe-env"
ACR_NAME="chatmfeacr"
IMAGE_NAME="chat-mfe"
IMAGE_TAG="latest"

echo "🚀 Starting Azure Container Apps deployment for Chat MFE..."

# Create resource group
echo "📦 Creating resource group..."
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Create Azure Container Registry
echo "🐳 Creating Azure Container Registry..."
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true

# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query loginServer --output tsv)
echo "ACR Login Server: $ACR_LOGIN_SERVER"

# Build and push Docker image
echo "🔨 Building and pushing Docker image..."
az acr build \
  --registry $ACR_NAME \
  --image $IMAGE_NAME:$IMAGE_TAG \
  --file Dockerfile \
  .

# Create Container Apps environment
echo "🌍 Creating Container Apps environment..."
az containerapp env create \
  --name $CONTAINER_APP_ENVIRONMENT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Create Container App
echo "📱 Creating Container App..."
az containerapp create \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_APP_ENVIRONMENT \
  --image $ACR_LOGIN_SERVER/$IMAGE_NAME:$IMAGE_TAG \
  --target-port 80 \
  --ingress external \
  --registry-server $ACR_LOGIN_SERVER \
  --query properties.configuration.ingress.fqdn \
  --output tsv

# Get the application URL
APP_URL=$(az containerapp show \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn \
  --output tsv)

echo "✅ Deployment completed successfully!"
echo "🌐 Your Chat MFE is available at: https://$APP_URL"
echo ""
echo "📋 Deployment Summary:"
echo "  - Resource Group: $RESOURCE_GROUP"
echo "  - Container App: $CONTAINER_APP_NAME"
echo "  - Environment: $CONTAINER_APP_ENVIRONMENT"
echo "  - Registry: $ACR_LOGIN_SERVER"
echo "  - URL: https://$APP_URL"
echo ""
echo "🔧 To update the app, run:"
echo "  az acr build --registry $ACR_NAME --image $IMAGE_NAME:$IMAGE_TAG --file Dockerfile ."
echo "  az containerapp update --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --image $ACR_LOGIN_SERVER/$IMAGE_NAME:$IMAGE_TAG"
