FROM node:20-slim

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml* ./

# Install all dependencies (including devDependencies for @nestjs/cli)
RUN pnpm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Use the local nest CLI from node_modules
CMD ["pnpm", "run", "start:dev"]