import { Router } from 'express';
import organizationController from '../controllers/organizationController';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { requireAdmin, requireManagerOrAdmin } from '../middleware/roleAuth';
import Joi from 'joi';

const router = Router();

router.use(auth);

const createOrganizationSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().trim(),
  description: Joi.string().max(500).optional().trim(),
  email: Joi.string().email().required().lowercase().trim(),
  phone: Joi.string().optional().trim(),
  website: Joi.string().uri().optional().trim(),
  address: Joi.object({
    street: Joi.string().max(200).optional().trim(),
    city: Joi.string().max(100).optional().trim(),
    state: Joi.string().max(100).optional().trim(),
    country: Joi.string().max(100).optional().trim(),
    zipCode: Joi.string().max(20).optional().trim()
  }).optional(),
  industry: Joi.string().max(100).optional().trim(),
  size: Joi.string().valid('startup', 'small', 'medium', 'large', 'enterprise').optional(),
  logo: Joi.string().optional().trim()
});

const updateOrganizationSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().trim(),
  description: Joi.string().max(500).optional().trim(),
  email: Joi.string().email().optional().lowercase().trim(),
  phone: Joi.string().optional().trim(),
  website: Joi.string().uri().optional().trim(),
  address: Joi.object({
    street: Joi.string().max(200).optional().trim(),
    city: Joi.string().max(100).optional().trim(),
    state: Joi.string().max(100).optional().trim(),
    country: Joi.string().max(100).optional().trim(),
    zipCode: Joi.string().max(20).optional().trim()
  }).optional(),
  industry: Joi.string().max(100).optional().trim(),
  size: Joi.string().valid('startup', 'small', 'medium', 'large', 'enterprise').optional(),
  logo: Joi.string().optional().trim(),
  isActive: Joi.boolean().optional()
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Organization:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - createdBy
 *       properties:
 *         id:
 *           type: string
 *           description: Organization ID
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Organization name
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: Organization description
 *         email:
 *           type: string
 *           format: email
 *           description: Organization email
 *         phone:
 *           type: string
 *           description: Organization phone number
 *         website:
 *           type: string
 *           format: uri
 *           description: Organization website
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *               maxLength: 200
 *             city:
 *               type: string
 *               maxLength: 100
 *             state:
 *               type: string
 *               maxLength: 100
 *             country:
 *               type: string
 *               maxLength: 100
 *             zipCode:
 *               type: string
 *               maxLength: 20
 *         industry:
 *           type: string
 *           maxLength: 100
 *           description: Organization industry
 *         size:
 *           type: string
 *           enum: [startup, small, medium, large, enterprise]
 *           description: Organization size
 *         logo:
 *           type: string
 *           description: Organization logo URL
 *         isActive:
 *           type: boolean
 *           description: Organization status
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateOrganization:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description:
 *           type: string
 *           maxLength: 500
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         website:
 *           type: string
 *           format: uri
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *               maxLength: 200
 *             city:
 *               type: string
 *               maxLength: 100
 *             state:
 *               type: string
 *               maxLength: 100
 *             country:
 *               type: string
 *               maxLength: 100
 *             zipCode:
 *               type: string
 *               maxLength: 20
 *         industry:
 *           type: string
 *           maxLength: 100
 *         size:
 *           type: string
 *           enum: [startup, small, medium, large, enterprise]
 *         logo:
 *           type: string
 */

/**
 * @swagger
 * /api/organizations:
 *   post:
 *     summary: Create a new organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrganization'
 *     responses:
 *       201:
 *         description: Organization created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/', requireAdmin, validate(createOrganizationSchema), organizationController.createOrganization);

/**
 * @swagger
 * /api/organizations:
 *   get:
 *     summary: Get all organizations
 *     tags: [Organizations]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by organization name
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: Filter by industry
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *           enum: [startup, small, medium, large, enterprise]
 *         description: Filter by organization size
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Organizations fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/', requireManagerOrAdmin, organizationController.getAllOrganizations);

/**
 * @swagger
 * /api/organizations/{id}:
 *   get:
 *     summary: Get organization by ID
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Organization fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Organization not found
 */
router.get('/:id', requireManagerOrAdmin, organizationController.getOrganizationById);

/**
 * @swagger
 * /api/organizations/{id}:
 *   put:
 *     summary: Update organization by ID
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrganization'
 *     responses:
 *       200:
 *         description: Organization updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Organization not found
 */
router.put('/:id', requireAdmin, validate(updateOrganizationSchema), organizationController.updateOrganization);

/**
 * @swagger
 * /api/organizations/{id}:
 *   delete:
 *     summary: Delete organization by ID
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Organization deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Organization not found
 */
router.delete('/:id', auth, requireAdmin, organizationController.deleteOrganization);

/**
 * @swagger
 * /api/organizations/{id}/restore:
 *   patch:
 *     summary: Restore deleted organization
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Organization restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Organization not found
 */
router.patch('/:id/restore', requireAdmin, organizationController.restoreOrganization);

export default router;