import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const accounts = await prisma.account.findMany();
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const account = await prisma.account.create({
      data: { 
        name, 
        userId: 1 // Default user for now
      }
    });
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create account' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Check if used
    const count = await prisma.transaction.count({
        where: { accountId: Number(id) }
    });
    if (count > 0) {
        return res.status(400).json({ error: 'Cannot delete account with transactions' });
    }

    await prisma.account.delete({
      where: { id: Number(id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
