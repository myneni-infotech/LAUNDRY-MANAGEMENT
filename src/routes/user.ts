import express from 'express';
import {
  createUser,
  updateUser,
  getUsers,
  getUserById,
  deleteUser,
  assignRole,
  assignClients
} from '../controllers/userController';
import { auth } from '../middleware/auth';
import { requireManagerOrAdmin, requireAdmin } from '../middleware/roleAuth';
import { validate } from '../middleware/validation';
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Joi validation schemas
const createUserSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(30)
    .required()
    .trim()
    .messages({
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 30 characters',
      'any.required': 'Username is required'
    }),
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  firstName: Joi.string()
    .max(50)
    .optional()
    .trim()
    .messages({
      'string.max': 'First name cannot exceed 50 characters'
    }),
  lastName: Joi.string()
    .max(50)
    .optional()
    .trim()
    .messages({
      'string.max': 'Last name cannot exceed 50 characters'
    }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/)
    .optional()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    }),
  role: Joi.string()
    .valid('collector', 'supervisor', 'admin', 'manager', 'user')
    .optional()
    .messages({
      'any.only': 'Role must be one of: collector, supervisor, admin, manager, user'
    }),
  clients: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .optional()
    .messages({
      'array.base': 'Clients must be an array',
      'string.pattern.base': 'Each client must be a valid MongoDB ObjectId'
    })
});

const updateUserSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(30)
    .optional()
    .trim()
    .messages({
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 30 characters'
    }),
  email: Joi.string()
    .email()
    .optional()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  firstName: Joi.string()
    .max(50)
    .optional()
    .trim()
    .messages({
      'string.max': 'First name cannot exceed 50 characters'
    }),
  lastName: Joi.string()
    .max(50)
    .optional()
    .trim()
    .messages({
      'string.max': 'Last name cannot exceed 50 characters'
    }),
  role: Joi.string()
    .valid('collector', 'supervisor', 'admin', 'manager', 'user')
    .optional()
    .messages({
      'any.only': 'Role must be one of: collector, supervisor, admin, manager, user'
    }),
  clients: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .optional()
    .messages({
      'array.base': 'Clients must be an array',
      'string.pattern.base': 'Each client must be a valid MongoDB ObjectId'
    }),
  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isActive must be a boolean value'
    })
});

const roleAssignmentSchema = Joi.object({
  role: Joi.string()
    .valid('collector', 'supervisor', 'admin', 'manager', 'user')
    .required()
    .messages({
      'any.only': 'Role must be one of: collector, supervisor, admin, manager, user',
      'any.required': 'Role is required'
    })
});

const clientAssignmentSchema = Joi.object({
  clients: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .required()
    .messages({
      'array.base': 'Clients must be an array',
      'string.pattern.base': 'Each client must be a valid MongoDB ObjectId',
      'any.required': 'Clients array is required'
    })
});

const userIdParamSchema = Joi.object({
  userId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid user ID format',
      'any.required': 'User ID is required'
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

// Routes

// Create user - Only admin and manager
router.post('/',
  requireManagerOrAdmin,
  validate(createUserSchema),
  createUser
);

// Query params schema for GET users
const getUsersQuerySchema = Joi.object({
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
  search: Joi.string()
    .optional()
    .trim()
    .messages({
      'string.base': 'Search must be a string'
    }),
  role: Joi.string()
    .valid('collector', 'supervisor', 'admin', 'manager', 'user')
    .optional()
    .messages({
      'any.only': 'Role filter must be one of: collector, supervisor, admin, manager, user'
    }),
  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isActive filter must be a boolean'
    })
});

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

// Get all users - Any authenticated user (filtered by permissions in controller)
router.get('/', 
  validateQuery(getUsersQuerySchema),
  getUsers
);

// Get user by ID - Any authenticated user (filtered by permissions in controller)
router.get('/:userId',
  validateParams(userIdParamSchema),
  getUserById
);

// Update user - Only admin and manager
router.put('/:userId',
  requireManagerOrAdmin,
  validateParams(userIdParamSchema),
  validate(updateUserSchema),
  updateUser
);

// Delete user - Only admin and manager
router.delete('/:userId',
  requireManagerOrAdmin,
  validateParams(userIdParamSchema),
  deleteUser
);

// Assign role - Only admin and manager
router.patch('/:userId/role',
  requireManagerOrAdmin,
  validateParams(userIdParamSchema),
  validate(roleAssignmentSchema),
  assignRole
);

// Assign clients - Only admin and manager
router.patch('/:userId/clients',
  requireManagerOrAdmin,
  validateParams(userIdParamSchema),
  validate(clientAssignmentSchema),
  assignClients
);

export default router;