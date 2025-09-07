import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/api';
import { AppError } from '../utils/AppError';
import { verifyAccessToken } from '../utils/tokenUtils';
import { User } from '../models';
import { userInfo } from 'node:os';

export const auth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return next(new AppError('Unauthorized: No token provided', 401));
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyAccessToken(token);

    if (!decoded) {
      return next(new AppError('Unauthorized: Invalid token', 401));
    }

    if (!decoded.userId) {
      return next(new AppError('Unauthorized: User ID not found', 401));
    }

    // get user details and add user in request
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new AppError('Unauthorized: User not found', 401));
    }

    req.user = user;

    next();
  } catch (error: any) {
    next(new AppError('Unauthorized: Invalid token', 401));
  }
};

