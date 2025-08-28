import { Request, Response, NextFunction } from 'express';
import { ApiResponse, AuthenticatedRequest } from '../types/api';
import { AppError } from '../utils/AppError';
import * as organizationService from '../services/organizationService';

class OrganizationController {
  public async createOrganization(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const organizationData = {
        ...req.body,
        createdBy: userId
      };

      const organization = await organizationService.createOrganization(organizationData);

      const response: ApiResponse = {
        success: true,
        message: 'Organization created successfully',
        data: organization
      };

      res.status(201).json(response);
    } catch (error: any) {
      next(error);
    }
  }

  public async getAllOrganizations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const filters = {
        name: req.query.name as string,
        industry: req.query.industry as string,
        size: req.query.size as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined
      };

      const result = await organizationService.getAllOrganizations(page, limit, filters);

      const response: ApiResponse = {
        success: true,
        message: 'Organizations fetched successfully',
        data: result
      };

      res.status(200).json(response);
    } catch (error: any) {
      next(error);
    }
  }

  public async getOrganizationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const organization = await organizationService.getOrganizationById(id);

      const response: ApiResponse = {
        success: true,
        message: 'Organization fetched successfully',
        data: organization
      };

      res.status(200).json(response);
    } catch (error: any) {
      next(error);
    }
  }

  public async updateOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const organization = await organizationService.updateOrganization(id, updateData);

      const response: ApiResponse = {
        success: true,
        message: 'Organization updated successfully',
        data: organization
      };

      res.status(200).json(response);
    } catch (error: any) {
      next(error);
    }
  }

  public async deleteOrganization(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      await organizationService.deleteOrganization(id, userId);

      const response: ApiResponse = {
        success: true,
        message: 'Organization deleted successfully',
        data: null
      };

      res.status(200).json(response);
    } catch (error: any) {
      next(error);
    }
  }

  public async restoreOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const organization = await organizationService.restoreOrganization(id);

      const response: ApiResponse = {
        success: true,
        message: 'Organization restored successfully',
        data: organization
      };

      res.status(200).json(response);
    } catch (error: any) {
      next(error);
    }
  }
}

export default new OrganizationController();