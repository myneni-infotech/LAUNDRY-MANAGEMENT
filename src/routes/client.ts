import { Router } from 'express';
import clientController from '../controllers/clientController';
import { auth as authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { requireManagerOrAdmin, requireSupervisorOrAbove, checkOrganizationAccess } from '../middleware/roleAuth';
import Joi from 'joi';

const router = Router();

const addressSchema = Joi.object({
  street: Joi.string().max(200).required().trim(),
  city: Joi.string().max(100).required().trim(),
  state: Joi.string().max(100).required().trim(),
  country: Joi.string().max(100).required().trim(),
  zipCode: Joi.string().max(20).required().trim(),
  landmark: Joi.string().max(100).optional().trim()
});

const createClientSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().trim(),
  aliasName: Joi.string().max(50).optional().trim(),
  clientCode: Joi.string().max(20).optional().trim().uppercase(),
  email: Joi.string().email().required().lowercase().trim(),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required().trim(),
  alternatePhone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional().trim(),
  address: addressSchema.required(),
  clientType: Joi.string().valid('individual', 'business', 'hotel', 'restaurant', 'hospital', 'other').required(),
  contactPerson: Joi.object({
    name: Joi.string().max(100).required().trim(),
    designation: Joi.string().max(50).optional().trim(),
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional().trim(),
    email: Joi.string().email().optional().lowercase().trim()
  }).optional(),
  billingAddress: Joi.object({
    street: Joi.string().max(200).optional().trim(),
    city: Joi.string().max(100).optional().trim(),
    state: Joi.string().max(100).optional().trim(),
    country: Joi.string().max(100).optional().trim(),
    zipCode: Joi.string().max(20).optional().trim()
  }).optional(),
  taxInfo: Joi.object({
    gstNumber: Joi.string().max(15).optional().trim().uppercase(),
    panNumber: Joi.string().max(10).optional().trim().uppercase()
  }).optional(),
  paymentTerms: Joi.string().max(100).optional().trim(),
  creditLimit: Joi.number().min(0).optional(),
  notes: Joi.string().max(500).optional().trim(),
  preferredPickupTime: Joi.string().max(50).optional().trim(),
  preferredDeliveryTime: Joi.string().max(50).optional().trim(),
  organizationId: Joi.string().required()
});

const updateClientSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().trim(),
  aliasName: Joi.string().max(50).optional().trim(),
  clientCode: Joi.string().max(20).optional().trim().uppercase(),
  email: Joi.string().email().optional().lowercase().trim(),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional().trim(),
  alternatePhone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional().trim(),
  address: Joi.object({
    street: Joi.string().max(200).optional().trim(),
    city: Joi.string().max(100).optional().trim(),
    state: Joi.string().max(100).optional().trim(),
    country: Joi.string().max(100).optional().trim(),
    zipCode: Joi.string().max(20).optional().trim(),
    landmark: Joi.string().max(100).optional().trim()
  }).optional(),
  clientType: Joi.string().valid('individual', 'business', 'hotel', 'restaurant', 'hospital', 'other').optional(),
  contactPerson: Joi.object({
    name: Joi.string().max(100).optional().trim(),
    designation: Joi.string().max(50).optional().trim(),
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional().trim(),
    email: Joi.string().email().optional().lowercase().trim()
  }).optional(),
  billingAddress: Joi.object({
    street: Joi.string().max(200).optional().trim(),
    city: Joi.string().max(100).optional().trim(),
    state: Joi.string().max(100).optional().trim(),
    country: Joi.string().max(100).optional().trim(),
    zipCode: Joi.string().max(20).optional().trim()
  }).optional(),
  taxInfo: Joi.object({
    gstNumber: Joi.string().max(15).optional().trim().uppercase(),
    panNumber: Joi.string().max(10).optional().trim().uppercase()
  }).optional(),
  paymentTerms: Joi.string().max(100).optional().trim(),
  creditLimit: Joi.number().min(0).optional(),
  notes: Joi.string().max(500).optional().trim(),
  preferredPickupTime: Joi.string().max(50).optional().trim(),
  preferredDeliveryTime: Joi.string().max(50).optional().trim(),
  isActive: Joi.boolean().optional()
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       required:
 *         - street
 *         - city
 *         - state
 *         - country
 *         - zipCode
 *       properties:
 *         street:
 *           type: string
 *           maxLength: 200
 *         city:
 *           type: string
 *           maxLength: 100
 *         state:
 *           type: string
 *           maxLength: 100
 *         country:
 *           type: string
 *           maxLength: 100
 *         zipCode:
 *           type: string
 *           maxLength: 20
 *         landmark:
 *           type: string
 *           maxLength: 100
 *     Client:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - phone
 *         - address
 *         - clientType
 *         - organizationId
 *       properties:
 *         id:
 *           type: string
 *           description: Client ID
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         aliasName:
 *           type: string
 *           maxLength: 50
 *         clientCode:
 *           type: string
 *           maxLength: 20
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *           pattern: '^[\+]?[1-9][\d]{0,15}$'
 *         alternatePhone:
 *           type: string
 *           pattern: '^[\+]?[1-9][\d]{0,15}$'
 *         address:
 *           $ref: '#/components/schemas/Address'
 *         clientType:
 *           type: string
 *           enum: [individual, business, hotel, restaurant, hospital, other]
 *         contactPerson:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               maxLength: 100
 *             designation:
 *               type: string
 *               maxLength: 50
 *             phone:
 *               type: string
 *               pattern: '^[\+]?[1-9][\d]{0,15}$'
 *             email:
 *               type: string
 *               format: email
 *         billingAddress:
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
 *         taxInfo:
 *           type: object
 *           properties:
 *             gstNumber:
 *               type: string
 *               maxLength: 15
 *             panNumber:
 *               type: string
 *               maxLength: 10
 *         paymentTerms:
 *           type: string
 *           maxLength: 100
 *         creditLimit:
 *           type: number
 *           minimum: 0
 *         notes:
 *           type: string
 *           maxLength: 500
 *         preferredPickupTime:
 *           type: string
 *           maxLength: 50
 *         preferredDeliveryTime:
 *           type: string
 *           maxLength: 50
 *         organizationId:
 *           type: string
 *           description: Organization ID
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateClient:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - phone
 *         - address
 *         - clientType
 *         - organizationId
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         aliasName:
 *           type: string
 *           maxLength: 50
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *           pattern: '^[\+]?[1-9][\d]{0,15}$'
 *         alternatePhone:
 *           type: string
 *           pattern: '^[\+]?[1-9][\d]{0,15}$'
 *         address:
 *           $ref: '#/components/schemas/Address'
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *         clientType:
 *           type: string
 *           enum: [individual, business]
 *         businessName:
 *           type: string
 *           maxLength: 100
 *         notes:
 *           type: string
 *           maxLength: 500
 *         preferredPickupTime:
 *           type: string
 *           maxLength: 50
 *         preferredDeliveryTime:
 *           type: string
 *           maxLength: 50
 *         organizationId:
 *           type: string
 */

/**
 * @swagger
 * /api/organizations/{organizationId}/clients:
 *   post:
 *     summary: Create a new client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClient'
 *     responses:
 *       201:
 *         description: Client created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/organizations/:organizationId/clients', authenticate, checkOrganizationAccess, requireSupervisorOrAbove, validate(createClientSchema), clientController.createClient);

/**
 * @swagger
 * /api/organizations/{organizationId}/clients:
 *   get:
 *     summary: Get all clients for an organization
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
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
 *         description: Filter by name
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Filter by email
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         description: Filter by phone
 *       - in: query
 *         name: clientType
 *         schema:
 *           type: string
 *           enum: [individual, business, hotel, restaurant, hospital, other]
 *         description: Filter by client type
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by state
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Clients fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/organizations/:organizationId/clients', authenticate, checkOrganizationAccess, requireSupervisorOrAbove, clientController.getAllClients);

/**
 * @swagger
 * /api/organizations/{organizationId}/clients/search:
 *   get:
 *     summary: Search clients
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
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
 *     responses:
 *       200:
 *         description: Client search completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/organizations/:organizationId/clients/search', authenticate, checkOrganizationAccess, requireSupervisorOrAbove, clientController.searchClients);

/**
 * @swagger
 * /api/organizations/{organizationId}/clients/{id}:
 *   get:
 *     summary: Get client by ID
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     responses:
 *       200:
 *         description: Client fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Client not found
 */
router.get('/organizations/:organizationId/clients/:id', authenticate, checkOrganizationAccess, requireSupervisorOrAbove, clientController.getClientById);

/**
 * @swagger
 * /api/organizations/{organizationId}/clients/{id}:
 *   put:
 *     summary: Update client by ID
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClient'
 *     responses:
 *       200:
 *         description: Client updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Client not found
 */
router.put('/organizations/:organizationId/clients/:id', authenticate, checkOrganizationAccess, requireSupervisorOrAbove, validate(updateClientSchema), clientController.updateClient);

/**
 * @swagger
 * /api/organizations/{organizationId}/clients/{id}:
 *   delete:
 *     summary: Delete client by ID
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     responses:
 *       200:
 *         description: Client deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Client not found
 */
router.delete('/organizations/:organizationId/clients/:id', authenticate, checkOrganizationAccess, requireManagerOrAdmin, clientController.deleteClient);

/**
 * @swagger
 * /api/organizations/{organizationId}/clients/{id}/restore:
 *   patch:
 *     summary: Restore deleted client
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     responses:
 *       200:
 *         description: Client restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Client not found
 */
router.patch('/organizations/:organizationId/clients/:id/restore', authenticate, checkOrganizationAccess, requireManagerOrAdmin, clientController.restoreClient);

export default router;