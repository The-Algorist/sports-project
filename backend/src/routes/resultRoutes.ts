import express from 'express';
import { GameStatus } from '@prisma/client';
import { buildQueryOptions, QueryOptions } from '../utils/queryUtils';
import { prisma } from '../lib/prisma';
import { io } from '../app';
import cloudinary from 'cloudinary';
import multer from 'multer';

const router = express.Router();

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

/**
 * @swagger
 * /api/results:
 *   get:
 *     summary: Retrieve a list of results
 *     tags: [Results]
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
 *         description: A list of results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Result'
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
    const queryOptions: any = buildQueryOptions(options, ['homeScore', 'awayScore', 'status']);

    const [results, total] = await Promise.all([
      prisma.result.findMany({
        ...queryOptions,
        include: { fixture: true },
      }),
      prisma.result.count({ where: queryOptions.where }),
    ]);

    res.json({
      data: results,
      total,
      page: options.page || 1,
      limit: options.limit || 10,
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching results' });
  }
});

/**
 * @swagger
 * /api/results:
 *   post:
 *     summary: Create a new result
 *     tags: [Results]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fixtureId:
 *                 type: string
 *               homeScore:
 *                 type: integer
 *               awayScore:
 *                 type: integer
 *               homeScorers:
 *                 type: string
 *               awayScorers:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [NOT_STARTED, IN_PROGRESS, FINISHED, POSTPONED, CANCELLED]
 *               currentPeriod:
 *                 type: string
 *               timeElapsed:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Created result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Result'
 */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { fixtureId, homeScore, awayScore, homeScorers, awayScorers, status, currentPeriod, timeElapsed } = req.body;
    let imageUrl = null;

    if (req.file) {
      const result = await cloudinary.v2.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
    }

    const result = await prisma.result.create({
      data: {
        fixtureId,
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        homeScorers: homeScorers ? JSON.parse(homeScorers) : [],
        awayScorers: awayScorers ? JSON.parse(awayScorers) : [],
        status: status as GameStatus,
        currentPeriod,
        timeElapsed: timeElapsed ? parseInt(timeElapsed) : null,
        imageUrl,
      },
      include: { fixture: true },
    });

    io.emit('resultUpdate', result);

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while creating the result' });
  }
});

/**
 * @swagger
 * /api/results/{id}:
 *   get:
 *     summary: Get a result by ID
 *     tags: [Results]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Result details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Result'
 *       404:
 *         description: Result not found
 */
router.get('/:id', async (req, res): Promise<any>=> {
  try {
    const { id } = req.params;
    const result = await prisma.result.findUnique({
      where: { id },
      include: { fixture: true },
    });
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the result' });
  }
});

/**
 * @swagger
 * /api/results/{id}:
 *   put:
 *     summary: Update a result
 *     tags: [Results]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               homeScore:
 *                 type: integer
 *               awayScore:
 *                 type: integer
 *               homeScorers:
 *                 type: string
 *               awayScorers:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [NOT_STARTED, IN_PROGRESS, FINISHED, POSTPONED, CANCELLED]
 *               currentPeriod:
 *                 type: string
 *               timeElapsed:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Updated result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Result'
 *       404:
 *         description: Result not found
 */
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { homeScore, awayScore, homeScorers, awayScorers, status, currentPeriod, timeElapsed } = req.body;
    let imageUrl = undefined;

    if (req.file) {
      const result = await cloudinary.v2.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
    }

    const result = await prisma.result.update({
      where: { id },
      data: {
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        homeScorers: homeScorers ? JSON.parse(homeScorers) : undefined,
        awayScorers: awayScorers ? JSON.parse(awayScorers) : undefined,
        status: status as GameStatus,
        currentPeriod,
        timeElapsed: timeElapsed ? parseInt(timeElapsed) : null,
        imageUrl,
      },
      include: { fixture: true },
    });

    io.emit('resultUpdate', result);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while updating the result' });
  }
});

/**
 * @swagger
 * /api/results/{id}:
 *   delete:
 *     summary: Delete a result
 *     tags: [Results]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Result deleted successfully
 *       404:
 *         description: Result not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.result.delete({ where: { id } });
    io.emit('resultDelete', id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while deleting the result' });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Result:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         fixtureId:
 *           type: string
 *         homeScore:
 *           type: integer
 *         awayScore:
 *           type: integer
 *         homeScorers:
 *           type: array
 *           items:
 *             type: string
 *         awayScorers:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           type: string
 *           enum: [NOT_STARTED, IN_PROGRESS, FINISHED, POSTPONED, CANCELLED]
 *         currentPeriod:
 *           type: string
 *         timeElapsed:
 *           type: integer
 *         imageUrl:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         fixture:
 *           $ref: '#/components/schemas/Fixture'
 */

export default router;

