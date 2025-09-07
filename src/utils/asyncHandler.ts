import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/api';

type AsyncFunction = (req: Request | AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response>;

export const asyncHandler = (fn: AsyncFunction) => {
  return (req: Request | AuthenticatedRequest, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};