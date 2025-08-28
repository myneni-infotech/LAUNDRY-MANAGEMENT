import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/api';
import { AppError } from '../utils/AppError';
import User from '../models/User';

type UserRole = 'collector' | 'supervisor' | 'admin' | 'manager' | 'user';

export const requireRole = (allowedRoles: UserRole | UserRole[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      const userId = req.user.userId || req.user.id;
      if (!userId) {
        return next(new AppError('Invalid user data', 401));
      }

      const user = await User.findById(userId).select('role');
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      const userRole = user.role;
      if (!userRole) {
        return next(new AppError('User role not assigned', 403));
      }

      const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      if (!rolesArray.includes(userRole)) {
        return next(new AppError(`Access denied. Required role(s): ${rolesArray.join(', ')}. Your role: ${userRole}`, 403));
      }

      req.user.role = userRole;
      next();
    } catch (error: any) {
      next(new AppError('Failed to verify user role', 500));
    }
  };
};

export const requireAdmin = requireRole('admin');

export const requireManagerOrAdmin = requireRole(['manager', 'admin']);

export const requireSupervisorOrAbove = requireRole(['supervisor', 'admin', 'manager']);

export const requireCollectorOrAbove = requireRole(['collector', 'supervisor', 'admin', 'manager']);

export const requireAnyRole = requireRole(['collector', 'supervisor', 'admin', 'manager', 'user']);

export const checkOrganizationAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const userId = req.user.userId || req.user.id;
    const { organizationId } = req.params;

    if (!organizationId) {
      return next();
    }

    const user = await User.findById(userId).select('organizationId role');
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (user.role === 'admin') {
      return next();
    }

    if (!user.organizationId || user.organizationId.toString() !== organizationId) {
      return next(new AppError('Access denied. You can only access resources from your organization', 403));
    }

    next();
  } catch (error: any) {
    next(new AppError('Failed to verify organization access', 500));
  }
};