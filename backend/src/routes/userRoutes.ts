import express from 'express';
import { Role, Gender } from '@prisma/client';
import { buildQueryOptions, QueryOptions } from '../utils/queryUtils';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retrieve a list of users
 *     tags: [Users]
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
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
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
    const queryOptions: any = buildQueryOptions(options, ['name', 'email', 'role', 'gender']);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        ...queryOptions,
        include: { university: true },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          gender: true,
          universityId: true,
          university: {
            select: {
              name: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where: queryOptions.where }),
    ]);

    res.json({
      data: users,
      total,
      page: options.page || 1,
      limit: options.limit || 10,
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching users' });
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, COACH, STUDENT, STAFF]
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *               universityId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role, gender, universityId } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as Role,
        gender: gender as Gender,
        universityId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        gender: true,
        universityId: true,
        university: {
          select: {
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while creating the user' });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get('/:id', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        gender: true,
        universityId: true,
        university: {
          select: {
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the user' });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update a user
 *     tags: [Users]
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
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, COACH, STUDENT, STAFF]
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *               universityId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, gender, universityId } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: { 
        name, 
        email, 
        role: role as Role, 
        gender: gender as Gender, 
        universityId 
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        gender: true,
        universityId: true,
        university: {
          select: {
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while updating the user' });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while deleting the user' });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [ADMIN, COACH, STUDENT, STAFF]
 *         gender:
 *           type: string
 *           enum: [MALE, FEMALE, OTHER]
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
 */

export default router;

