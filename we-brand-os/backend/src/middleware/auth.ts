import { Request, Response, NextFunction } from 'express';
import { env } from '../utils/env.js';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const headerKey = req.header('x-api-key');
  if (!env.apiKey || headerKey !== env.apiKey) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}
