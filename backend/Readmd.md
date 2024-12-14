# Project Setup Instructions
// 
## Prerequisites
- Ensure you have Docker and Docker Compose installed on your machine.
- Node.js and npm should also be installed.

## Environment Setup
1. **Create `.env` file**: 
   - Copy the example environment file:
     ```bash
     cp .env.example .env
     ```

2. **Start the Database**:
   - Use Docker Compose to start the PostgreSQL database:
     ```bash
     pnpm run docker:up
     ```

3. **Push Prisma Schema**:
   - Push the Prisma schema to the database:
     ```bash
     pnpm run prisma:push
     ```

4. **Generate Prisma Client**:
   - Generate the Prisma client:
     ```bash
     pnpm run prisma:generate
     ```

## Running the Application
- To start the development server, run:
  ```bash
  pnpm run dev
  ```

## Stopping the Database
- To stop the database, run:
  ```bash
  npm run docker:down
  ```

## Additional Commands
- **Build the project**:
  ```bash
  npm run build
  ```

- **Start the built application**:
  ```bash
  npm start
  ```