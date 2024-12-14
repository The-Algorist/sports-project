import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swaggerConfig';
import universityRoutes from './routes/universityRoutes';
import sportRoutes from './routes/sportRoutes';
import fixtureRoutes from './routes/fixtureRoutes';
import resultRoutes from './routes/resultRoutes';
import userRoutes from './routes/userRoutes';
// TODO: Add error handling
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/universities', universityRoutes);
app.use('/api/sports', sportRoutes);
app.use('/api/fixtures', fixtureRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3000;

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});

export { app, io };

