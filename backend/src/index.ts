import express, { Express, Request, Response } from 'express';
import v1ApiRoutes from './api/v1/routes';

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check route
app.get('/', (req: Request, res: Response) => {
  res.send('WE Brand OS Backend is running!');
});

// V1 API Routes
app.use('/api/v1', v1ApiRoutes);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
