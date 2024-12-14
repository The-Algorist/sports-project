import express from 'express';
import { buildQueryOptions, QueryOptions } from '../utils/queryUtils';
import { prisma } from '../lib/prisma';

const router = express.Router();

/**
 * @swagger
 * /api/sports:
 *   get:
 *     summary: Retrieve a list of sports
 *     tags: [Sports]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: A list of sports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Sport'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 */
router.get('/', async (req, res) => {
  try {
    const options: QueryOptions = req.query;
    const queryOptions: any = buildQueryOptions(options, ['name']);

    const [sports, total] = await Promise.all([
      prisma.sport.findMany({
        ...queryOptions,
        include: { university: true },
      }),
      prisma.sport.count({ where: queryOptions.where }),
    ]);

    res.json({
      data: sports,
      total,
      page: options.page || 1,
      limit: options.limit || 10,
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching sports' });
  }
});

/**
 * @swagger
 * /api/sports:
 *   post:
 *     summary: Create a new sport
 *     tags: [Sports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               universityId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created sport
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sport'
 */
router.post('/', async (req, res) => {
  try {
    const { name, universityId } = req.body;
    const sport = await prisma.sport.create({
      data: { name, universityId },
      include: { university: true },
    });
    res.status(201).json(sport);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while creating the sport' });
  }
});

/**
 * @swagger
 * /api/sports/{id}:
 *   get:
 *     summary: Get a sport by ID
 *     tags: [Sports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sport details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sport'
 *       404:
 *         description: Sport not found
 */
router.get('/:id', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const sport = await prisma.sport.findUnique({
      where: { id },
      include: { university: true, fixtures: true },
    });
    if (!sport) {
      return res.status(404).json({ error: 'Sport not found' });
    }
    res.json(sport);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the sport' });
  }
});

/**
 * @swagger
 * /api/sports/{id}:
 *   put:
 *     summary: Update a sport
 *     tags: [Sports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               universityId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated sport
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sport'
 *       404:
 *         description: Sport not found
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, universityId } = req.body;
    const sport = await prisma.sport.update({
      where: { id },
      data: { name, universityId },
      include: { university: true },
    });
    res.json(sport);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while updating the sport' });
  }
});

/**
 * @swagger
 * /api/sports/{id}:
 *   delete:
 *     summary: Delete a sport
 *     tags: [Sports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Sport deleted successfully
 *       404:
 *         description: Sport not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.sport.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while deleting the sport' });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Sport:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         universityId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         university:
 *           $ref: '#/components/schemas/University'
 *         fixtures:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Fixture'
 */

export default router;

