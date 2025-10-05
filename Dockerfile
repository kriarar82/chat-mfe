# Build stage
FROM node:14-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Set build-time environment variables
ARG REACT_APP_AGENT_URL
ARG REACT_APP_AGENT_API_BASE_URL
ARG REACT_APP_APP_NAME
ARG REACT_APP_DEBUG
ARG REACT_APP_DEFAULT_USER_ID

# Set environment variables for build
ENV REACT_APP_AGENT_URL=$REACT_APP_AGENT_URL
ENV REACT_APP_AGENT_API_BASE_URL=$REACT_APP_AGENT_API_BASE_URL
ENV REACT_APP_APP_NAME=$REACT_APP_APP_NAME
ENV REACT_APP_DEBUG=$REACT_APP_DEBUG
ENV REACT_APP_DEFAULT_USER_ID=$REACT_APP_DEFAULT_USER_ID

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
