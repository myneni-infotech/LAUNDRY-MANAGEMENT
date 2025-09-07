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

      const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      if (!req.user.role || !rolesArray.includes(req.user.role)) {
        return next(new AppError(`Access denied. Required role(s): ${rolesArray.join(', ')}. Your role: ${req.user.role ?? 'undefined'}`, 403));
      }

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
