import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, type } = req.body;
    const category = await prisma.category.create({
      data: { 
        name, 
        type, 
        userId: 1 // Default user for now
      }
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Check if used
    const count = await prisma.transaction.count({
        where: { categoryId: Number(id) }
    });
    if (count > 0) {
        return res.status(400).json({ error: 'Cannot delete category with transactions' });
    }

    await prisma.category.delete({
      where: { id: Number(id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
