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
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter sports by name (case-insensitive)
 *     responses:
 *       200:
 *         description: A paginated list of sports
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
 *                   description: Total number of sports matching the query
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                 limit:
 *                   type: integer
 *                   description: Number of items per page
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/', async (req, res) => {
  try {
    const options: QueryOptions = req.query;
    const queryOptions: any = buildQueryOptions(options, ['name']);

    const [sports, total] = await Promise.all([
      prisma.sport.findMany({
        ...queryOptions,
        include: { fixtures: true },
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
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the sport
 *               type:
 *                 type: string
 *                 description: Type of the sport
 *     responses:
 *       201:
 *         description: Sport created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sport'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/', async (req, res) => {
  try {
    const { name, type } = req.body;
    const sport = await prisma.sport.create({
      data: { name, type },
      include: { fixtures: true },
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
 *         description: Sport ID
 *     responses:
 *       200:
 *         description: Sport details with related fixtures and university
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sport'
 *       404:
 *         description: Sport not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/:id', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const sport = await prisma.sport.findUnique({
      where: { id },
      include: { fixtures: true, university: true },
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
 *         description: Sport ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated name of the sport
 *               type:
 *                 type: string
 *                 description: Updated type of the sport
 *     responses:
 *       200:
 *         description: Sport updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sport'
 *       404:
 *         description: Sport not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type } = req.body;
    const sport = await prisma.sport.update({
      where: { id },
      data: { name, type },
      include: { university: true, fixtures: true  },
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
 *         description: Sport ID
 *     responses:
 *       204:
 *         description: Sport deleted successfully
 *       404:
 *         description: Sport not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
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
 *       required:
 *         - id
 *         - name
 *         - type
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the sport
 *         name:
 *           type: string
 *           description: Name of the sport
 *         type:
 *           type: string
 *           description: Type of the sport
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the sport was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the sport was last updated
 *         fixtures:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Fixture'
 *           description: List of fixtures associated with this sport
 *         university:
 *           $ref: '#/components/schemas/University'
 *           description: University associated with this sport
 */

export default router;