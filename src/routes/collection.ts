import { Router } from 'express';
import {
  createCollection,
  getAllCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  getCollectionsByClient,
  getCollectionsByStatus,
  getCollectionStats
} from '../controllers/collectionController';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { requireCollectorOrAbove, requireManagerOrAdmin } from '../middleware/roleAuth';
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(auth);

// Joi validation schemas
const createCollectionSchema = Joi.object({
  clientId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Client ID must be a valid MongoDB ObjectId',
      'any.required': 'Client ID is required'
    }),
  dateTime: Joi.date()
    .optional()
    .default(() => new Date())
    .messages({
      'date.base': 'Date time must be a valid date'
    }),
  status: Joi.string()
    .valid('pending', 'collected', 'in_transit', 'washing', 'packing', 'delivered', 'cancelled')
    .optional()
    .default('pending')
    .messages({
      'any.only': 'Status must be one of: pending, collected, in_transit, washing, packing, delivered, cancelled'
    }),
  notes: Joi.string()
    .max(500)
    .optional()
    .trim()
    .messages({
      'string.max': 'Notes cannot exceed 500 characters'
    }),
  items: Joi.array()
    .items(Joi.object({
      description: Joi.string()
        .max(200)
        .required()
        .trim()
        .messages({
          'string.max': 'Item description cannot exceed 200 characters',
          'any.required': 'Item description is required'
        }),
      quantity: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
          'number.integer': 'Quantity must be an integer',
          'number.min': 'Quantity must be at least 1',
          'any.required': 'Item quantity is required'
        }),
      category: Joi.string()
        .max(50)
        .optional()
        .trim()
        .messages({
          'string.max': 'Category cannot exceed 50 characters'
        })
    }))
    .optional()
    .messages({
      'array.base': 'Items must be an array'
    })
});

const updateCollectionSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'collected', 'in_transit', 'washing', 'packing', 'delivered', 'cancelled')
    .optional()
    .messages({
      'any.only': 'Status must be one of: pending, collected, in_transit, washing, packing, delivered, cancelled'
    }),
  notes: Joi.string()
    .max(500)
    .optional()
    .trim()
    .messages({
      'string.max': 'Notes cannot exceed 500 characters'
    }),
  items: Joi.array()
    .items(Joi.object({
      description: Joi.string()
        .max(200)
        .required()
        .trim()
        .messages({
          'string.max': 'Item description cannot exceed 200 characters',
          'any.required': 'Item description is required'
        }),
      quantity: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
          'number.integer': 'Quantity must be an integer',
          'number.min': 'Quantity must be at least 1',
          'any.required': 'Item quantity is required'
        }),
      category: Joi.string()
        .max(50)
        .optional()
        .trim()
        .messages({
          'string.max': 'Category cannot exceed 50 characters'
        })
    }))
    .optional()
    .messages({
      'array.base': 'Items must be an array'
    })
});

const collectionIdParamSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Collection ID must be a valid MongoDB ObjectId',
      'any.required': 'Collection ID is required'
    })
});

const clientIdParamSchema = Joi.object({
  clientId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Client ID must be a valid MongoDB ObjectId',
      'any.required': 'Client ID is required'
    })
});

const statusParamSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'collected', 'in_transit', 'washing', 'packing', 'delivered', 'cancelled')
    .required()
    .messages({
      'any.only': 'Status must be one of: pending, collected, in_transit, washing, packing, delivered, cancelled',
      'any.required': 'Status is required'
    })
});

const getCollectionsQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  status: Joi.string()
    .valid('pending', 'collected', 'in_transit', 'washing', 'packing', 'delivered', 'cancelled')
    .optional()
    .messages({
      'any.only': 'Status filter must be one of: pending, collected, in_transit, washing, packing, delivered, cancelled'
    }),
  clientId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Client ID filter must be a valid MongoDB ObjectId'
    }),
  collectedBy: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Collected by filter must be a valid MongoDB ObjectId'
    }),
  dateFrom: Joi.date()
    .optional()
    .messages({
      'date.base': 'Date from must be a valid date'
    }),
  dateTo: Joi.date()
    .optional()
    .messages({
      'date.base': 'Date to must be a valid date'
    }),
  search: Joi.string()
    .optional()
    .trim()
    .messages({
      'string.base': 'Search must be a string'
    })
});

// Validation middleware for params
const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.params, { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: errorMessage
      });
    }
    
    next();
  };
};

// Validation middleware for query params
const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: errorMessage
      });
    }
    
    req.query = value; // Apply defaults and transformations
    next();
  };
};

/**
 * @swagger
 * components:
 *   schemas:
 *     CollectionItem:
 *       type: object
 *       required:
 *         - description
 *         - quantity
 *       properties:
 *         description:
 *           type: string
 *           maxLength: 200
 *         quantity:
 *           type: integer
 *           minimum: 1
 *         category:
 *           type: string
 *           maxLength: 50
 *     Collection:
 *       type: object
 *       required:
 *         - collectionCode
 *         - organizationId
 *         - clientId
 *         - collectedBy
 *       properties:
 *         id:
 *           type: string
 *         collectionCode:
 *           type: string
 *           maxLength: 20
 *         organizationId:
 *           type: string
 *         clientId:
 *           type: string
 *         dateTime:
 *           type: string
 *           format: date-time
 *         collectedBy:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, collected, in_transit, washing, packing, delivered, cancelled]
 *         notes:
 *           type: string
 *           maxLength: 500
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CollectionItem'
 *         totalItems:
 *           type: integer
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateCollection:
 *       type: object
 *       required:
 *         - clientId
 *       properties:
 *         clientId:
 *           type: string
 *         dateTime:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [pending, collected, in_transit, washing, packing, delivered, cancelled]
 *         notes:
 *           type: string
 *           maxLength: 500
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CollectionItem'
 */

/**
 * @swagger
 * /api/collections:
 *   post:
 *     summary: Create a new collection
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCollection'
 *     responses:
 *       201:
 *         description: Collection created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User not assigned to this client
 */
router.post('/',
  requireCollectorOrAbove,
  validate(createCollectionSchema),
  createCollection
);

/**
 * @swagger
 * /api/collections:
 *   get:
 *     summary: Get all collections
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, collected, in_transit, washing, packing, delivered, cancelled]
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *       - in: query
 *         name: collectedBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Collections retrieved successfully
 */
router.get('/',
  validateQuery(getCollectionsQuerySchema),
  getAllCollections
);

/**
 * @swagger
 * /api/collections/{id}:
 *   get:
 *     summary: Get collection by ID
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Collection retrieved successfully
 *       404:
 *         description: Collection not found
 */
router.get('/:id',
  validateParams(collectionIdParamSchema),
  getCollectionById
);

/**
 * @swagger
 * /api/collections/{id}:
 *   put:
 *     summary: Update collection by ID
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
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
 *               status:
 *                 type: string
 *                 enum: [pending, collected, in_transit, washing, packing, delivered, cancelled]
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CollectionItem'
 *     responses:
 *       200:
 *         description: Collection updated successfully
 *       404:
 *         description: Collection not found
 */
router.put('/:id',
  validateParams(collectionIdParamSchema),
  validate(updateCollectionSchema),
  updateCollection
);

/**
 * @swagger
 * /api/collections/{id}:
 *   delete:
 *     summary: Delete collection by ID
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Collection deleted successfully
 *       404:
 *         description: Collection not found
 */
router.delete('/:id',
  requireManagerOrAdmin,
  validateParams(collectionIdParamSchema),
  deleteCollection
);

/**
 * @swagger
 * /api/collections/client/{clientId}:
 *   get:
 *     summary: Get collections by client ID
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Collections retrieved successfully
 */
router.get('/client/:clientId',
  validateParams(clientIdParamSchema),
  validateQuery(Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(10)
  })),
  getCollectionsByClient
);

/**
 * @swagger
 * /api/collections/status/{status}:
 *   get:
 *     summary: Get collections by status
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, collected, in_transit, washing, packing, delivered, cancelled]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Collections retrieved successfully
 */
router.get('/status/:status',
  validateParams(statusParamSchema),
  validateQuery(Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(10)
  })),
  getCollectionsByStatus
);

/**
 * @swagger
 * /api/collections/stats:
 *   get:
 *     summary: Get collection statistics
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *       - in: query
 *         name: collectedBy
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Collection statistics retrieved successfully
 */
router.get('/stats',
  validateQuery(Joi.object({
    dateFrom: Joi.date().optional(),
    dateTo: Joi.date().optional(),
    clientId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    collectedBy: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional()
  })),
  getCollectionStats
);

export default router;