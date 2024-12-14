import express from 'express';
import { Gender } from '@prisma/client';
import { buildQueryOptions, QueryOptions } from '../utils/queryUtils';
import { prisma } from '../lib/prisma';

const router = express.Router();

/**
 * @swagger
 * /api/fixtures:
 *   get:
 *     summary: Retrieve a list of fixtures
 *     tags: [Fixtures]
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
 *       - in: query
 *         name: sportId
 *         schema:
 *           type: string
 *         description: Filter by sport ID
 *       - in: query
 *         name: universityId
 *         schema:
 *           type: string
 *         description: Filter by university ID
 *     responses:
 *       200:
 *         description: A list of fixtures
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Fixture'
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
    const queryOptions = buildQueryOptions(options, ['homeTeam', 'awayTeam', 'venue']);

    const [fixtures, total] = await Promise.all([
      prisma.fixture.findMany({
        ...queryOptions,
        include: { 
          sport: {
            include: {
              university: true
            }
          }, 
          result: true 
        },
      }),
      prisma.fixture.count({ where: queryOptions.where }),
    ]);

    res.json({
      data: fixtures,
      total,
      page: options.page || 1,
      limit: options.limit || 10,
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching fixtures' });
  }
});

/**
 * @swagger
 * /api/fixtures:
 *   post:
 *     summary: Create a new fixture
 *     tags: [Fixtures]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sportId:
 *                 type: string
 *               homeTeam:
 *                 type: string
 *               awayTeam:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               venue:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *     responses:
 *       201:
 *         description: Created fixture
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Fixture'
 */
router.post('/', async (req, res) => {
  try {
    const { sportId, homeTeam, awayTeam, date, venue, gender } = req.body;
    const fixture = await prisma.fixture.create({
      data: { 
        sportId, 
        homeTeam, 
        awayTeam, 
        date: new Date(date), 
        venue, 
        gender: gender as Gender 
      },
      include: { 
        sport: {
          include: {
            university: true
          }
        } 
      },
    });
    res.status(201).json(fixture);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while creating the fixture' });
  }
});

/**
 * @swagger
 * /api/fixtures/{id}:
 *   get:
 *     summary: Get a fixture by ID
 *     tags: [Fixtures]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fixture details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Fixture'
 *       404:
 *         description: Fixture not found
 */
router.get('/:id', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const fixture = await prisma.fixture.findUnique({
      where: { id },
      include: { 
        sport: {
          include: {
            university: true
          }
        }, 
        result: true 
      },
    });
    if (!fixture) {
      return res.status(404).json({ error: 'Fixture not found' });
    }
    res.json(fixture);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the fixture' });
  }
});

/**
 * @swagger
 * /api/fixtures/{id}:
 *   put:
 *     summary: Update a fixture
 *     tags: [Fixtures]
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
 *               sportId:
 *                 type: string
 *               homeTeam:
 *                 type: string
 *               awayTeam:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               venue:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *     responses:
 *       200:
 *         description: Updated fixture
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Fixture'
 *       404:
 *         description: Fixture not found
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { sportId, homeTeam, awayTeam, date, venue, gender } = req.body;
    const fixture = await prisma.fixture.update({
      where: { id },
      data: { 
        sportId, 
        homeTeam, 
        awayTeam, 
        date: new Date(date), 
        venue, 
        gender: gender as Gender 
      },
      include: { 
        sport: {
          include: {
            university: true
          }
        } 
      },
    });
    res.json(fixture);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while updating the fixture' });
  }
});

/**
 * @swagger
 * /api/fixtures/{id}:
 *   delete:
 *     summary: Delete a fixture
 *     tags: [Fixtures]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Fixture deleted successfully*       404:
 *         description: Fixture not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.fixture.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while deleting the fixture' });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Fixture:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         sportId:
 *           type: string
 *         homeTeam:
 *           type: string
 *         awayTeam:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         venue:
 *           type: string
 *         gender:
 *           type: string
 *           enum: [MALE, FEMALE, OTHER]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         sport:
 *           $ref: '#/components/schemas/Sport'
 *         result:
 *           $ref: '#/components/schemas/Result'
 */

export default router;

