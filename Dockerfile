# Use official Node.js runtime as base image
FROM node:20-alpine

# Install git for repository operations
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Copy package files (will be updated by entrypoint)
COPY package*.json ./

# Install dependencies (will be updated by entrypoint)
RUN npm ci --only=production || true

# Copy application files (will be updated by entrypoint)
COPY . .

# Create logs directory
RUN mkdir -p logs

# Set environment to production
ENV NODE_ENV=production

# Set entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]

# Run the bot
CMD ["node", "bot.js"]

