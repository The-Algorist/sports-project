import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'University Sports System API',
      version: '1.0.0',
      description: 'API for managing university sports events and results',
    },
    servers: [
      {
        url: 'http://193.108.53.103:3001',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);

