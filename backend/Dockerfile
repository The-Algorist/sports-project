FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN pnpm prisma generate

# Copy the rest of the application
COPY . .

# Build the application
RUN pnpm build

EXPOSE 3001

# Start the application
CMD ["pnpm", "start"] 