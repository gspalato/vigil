## Stage 1: build
#FROM node:20-alpine AS builder

#WORKDIR /app

## Install dependencies
#COPY package*.json ./
#RUN npm install

## Copy source code
#COPY tsconfig.json ./

#COPY src/ ./src

## Build TypeScript to JavaScript
#RUN npm run build

# Stage 2: production
FROM node:20-alpine

WORKDIR /app

# Copy only production dependencies
COPY package.json ./
RUN  npm install

#Copy source TS from build stage
COPY src/ ./src

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the service
CMD ["npx", "tsx", "src/main.ts"]
