import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllShippingZones = async (req: Request, res: Response) => {
  try {
    const shippingZones = await prisma.shippingZone.findMany();
    res.status(200).json(shippingZones);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shipping zones.' });
  }
};
