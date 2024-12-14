import express from 'express';
import { buildQueryOptions, QueryOptions } from '../utils/queryUtils';
import { prisma } from '../lib/prisma';
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
 * /api/universities:
 *   get:
 *     summary: Retrieve a list of universities
 *     tags: [Universities]
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
 *         description: A list of universities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/University'
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
    const queryOptions: any = buildQueryOptions(options, ['name', 'location']);

    const [universities, total] = await Promise.all([
      prisma.university.findMany({
        ...queryOptions,
        include: {
          sports: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.university.count({ where: queryOptions.where }),
    ]);

    res.json({
      data: universities,
      total,
      page: options.page || 1,
      limit: options.limit || 10,
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching universities' });
  }
});

/**
 * @swagger
 * /api/universities:
 *   post:
 *     summary: Create a new university
 *     tags: [Universities]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Created university
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/University'
 */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, location } = req.body;
    let imageUrl = null;

    if (req.file) {
      const result = await cloudinary.v2.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
    }

    const university = await prisma.university.create({
      data: { 
        name, 
        location,
        imageUrl
      },
      include: {
        sports: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
    res.status(201).json(university);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while creating the university' });
  }
});

/**
 * @swagger
 * /api/universities/{id}:
 *   get:
 *     summary: Get a university by ID
 *     tags: [Universities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: University details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/University'
 *       404:
 *         description: University not found
 */
router.get('/:id', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const university = await prisma.university.findUnique({
      where: { id },
      include: {
        sports: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
    if (!university) {
      return res.status(404).json({ error: 'University not found' });
    }
    res.json(university);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the university' });
  }
});

/**
 * @swagger
 * /api/universities/{id}:
 *   put:
 *     summary: Update a university
 *     tags: [Universities]
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
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Updated university
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/University'
 *       404:
 *         description: University not found
 */
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;
    let imageUrl = undefined;

    if (req.file) {
      const result = await cloudinary.v2.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
    }

    const university = await prisma.university.update({
      where: { id },
      data: { 
        name, 
        location,
        imageUrl
      },
      include: {
        sports: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
    res.json(university);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while updating the university' });
  }
});

/**
 * @swagger
 * /api/universities/{id}:
 *   delete:
 *     summary: Delete a university
 *     tags: [Universities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: University deleted successfully
 *       404:
 *         description: University not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.university.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while deleting the university' });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     University:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         location:
 *           type: string
 *         imageUrl:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         sports:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Sport'
 *         users:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 */

export default router;

