import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { AuthenticatedRequest } from '../types/api';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { Types } from 'mongoose';

export const createUser = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const {
    username,
    email,
    password,
    firstName,
    lastName,
    role,
    organization,
    clients,
    profilePicture
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    return next(new AppError('User with this email or username already exists', 400));
  }

  // Validate role assignment - only admin and manager can assign roles
  if (role && !['admin', 'manager'].includes(req.user?.role || '')) {
    return next(new AppError('Only admin and manager can assign roles to users', 403));
  }

  // Create user data
  const userData: any = {
    username,
    email,
    firstName,
    lastName,
    profilePicture,
    authProvider: 'local'
  };

  // Only include password if provided
  if (password) {
    userData.password = password;
  }

  // Only admin and manager can assign organization and clients
  if (['admin', 'manager'].includes(req.user?.role || '')) {
    if (organization) {
      userData.organization = organization;
    }
    if (clients && Array.isArray(clients)) {
      userData.clients = clients;
    }
    if (role) {
      userData.role = role;
    }
  } else {
    // For other roles, inherit organization from creator
    if (req.user?.organization) {
      userData.organization = req.user.organization;
    }
    userData.role = 'user'; // Default role for users created by non-admin/manager
  }

  const user = new User(userData);
  await user.save();

  // Remove sensitive fields before sending response
  const userResponse = user.toJSON();
  delete userResponse.password;

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      user: userResponse
    }
  });
});

export const updateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { userId } = req.params;
  const {
    username,
    email,
    firstName,
    lastName,
    role,
    organization,
    clients,
    profilePicture,
    isActive
  } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check if current user can update this user
  const currentUserRole = req.user?.role;
  const isAdminOrManager = ['admin', 'manager'].includes(currentUserRole || '');

  // Only admin and manager can update roles and organization assignments
  if ((role || organization || clients) && !isAdminOrManager) {
    return next(new AppError('Only admin and manager can update user roles and organization assignments', 403));
  }

  // Only admin and manager can activate/deactivate users
  if (isActive !== undefined && !isAdminOrManager) {
    return next(new AppError('Only admin and manager can activate/deactivate users', 403));
  }

  // Update basic fields
  if (username) user.username = username;
  if (email) user.email = email;
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (profilePicture) user.profilePicture = profilePicture;

  // Update role and organization only if user has permission
  if (isAdminOrManager) {
    if (role) user.role = role;
    if (organization) user.organization = organization;
    if (clients && Array.isArray(clients)) user.clients = clients;
    if (isActive !== undefined) user.isActive = isActive;
  }

  await user.save();

  const userResponse = user.toJSON();
  delete userResponse.password;

  res.json({
    success: true,
    message: 'User updated successfully',
    data: {
      user: userResponse
    }
  });
});

export const getUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { page = 1, limit = 10, role, isActive, organization } = req.query;
  const currentUserRole = req.user?.role;

  // Build query based on user role
  let query: any = { isDeleted: false };

  // Non-admin users can only see users from their organization
  if (currentUserRole !== 'admin' && req.user?.organization) {
    query.organization = req.user.organization;
  }

  // Apply filters
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (organization && currentUserRole === 'admin') query.organization = organization;

  const users = await User.find(query)
    .select('-password -refreshTokens -passwordResetToken -emailVerificationToken')
    .populate('organization', 'name')
    .populate('clients', 'name email')
    .sort({ createdAt: -1 })
    .limit(Number(limit) * 1)
    .skip((Number(page) - 1) * Number(limit));

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total
      }
    }
  });
});

export const getUserById = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { userId } = req.params;
  const currentUserRole = req.user?.role;

  let query: any = { _id: userId, isDeleted: false };

  // Non-admin users can only view users from their organization
  if (currentUserRole !== 'admin' && req.user?.organization) {
    query.organization = req.user.organization;
  }

  const user = await User.findOne(query)
    .select('-password -refreshTokens -passwordResetToken -emailVerificationToken')
    .populate('organization', 'name')
    .populate('clients', 'name email');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.json({
    success: true,
    data: {
      user
    }
  });
});

export const deleteUser = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Soft delete the user
  user.isDeleted = true;
  user.isActive = false;
  user.deletedAt = new Date();
  user.deletedBy = new Types.ObjectId(req.user?.id);
  
  await user.save();

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

export const assignRole = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { userId } = req.params;
  const { role } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Update role
  user.role = role;
  await user.save();

  const userResponse = user.toJSON();
  delete userResponse.password;

  res.json({
    success: true,
    message: 'Role assigned successfully',
    data: {
      user: userResponse
    }
  });
});

export const assignClients = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { userId } = req.params;
  const { clients } = req.body;

  if (!Array.isArray(clients)) {
    return next(new AppError('Clients must be an array of client IDs', 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Update clients
  user.clients = clients;
  await user.save();

  const userResponse = user.toJSON();
  delete userResponse.password;

  res.json({
    success: true,
    message: 'Clients assigned successfully',
    data: {
      user: userResponse
    }
  });
});