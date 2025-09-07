import { Request, Response, NextFunction } from 'express';
import { ApiResponse, AuthenticatedRequest } from '../types/api';
import { AppError } from '../utils/AppError';
import * as clientService from '../services/clientService';

class ClientController {
  public async createClient(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const clientData = {
        ...req.body,
        createdBy: userId
      };

      const client = await clientService.createClient(clientData);

      const response: ApiResponse = {
        success: true,
        message: 'Client created successfully',
        data: client
      };

      res.status(201).json(response);
    } catch (error: any) {
      next(error);
    }
  }

  public async getAllClients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { organizationId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;
      const filters = {
        name: req.query.name as string,
        email: req.query.email as string,
        phone: req.query.phone as string,
        clientType: req.query.clientType as string,
        city: req.query.city as string,
        state: req.query.state as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined
      };

      const result = await clientService.getAllClients(organizationId, page, limit, filters);

      const response: ApiResponse = {
        success: true,
        message: 'Clients fetched successfully',
        data: result
      };

      res.status(200).json(response);
    } catch (error: any) {
      next(error);
    }
  }

  public async getClientById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, organizationId } = req.params;
      const client = await clientService.getClientById(id, organizationId);

      const response: ApiResponse = {
        success: true,
        message: 'Client fetched successfully',
        data: client
      };

      res.status(200).json(response);

    } catch (error: any) {
      next(error);
    }
  }

  public async updateClient(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      //  const { id, organizationId } = [req.user._id, req.user.organization._id];
      const id = req.user._id?.toString();
      const organizationId = req.user?.organization?._id?.toString();
      const updateData = req.body;

      const client = await clientService.updateClient(id, updateData, organizationId);

      const response: ApiResponse = {
        success: true,
        message: 'Client updated successfully',
        data: client
      };

      res.status(200).json(response);
    } catch (error: any) {
      next(error);
    }
  }

  public async deleteClient(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, organizationId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      await clientService.deleteClient(id, userId, organizationId);

      const response: ApiResponse = {
        success: true,
        message: 'Client deleted successfully',
        data: null
      };

      res.status(200).json(response);
    } catch (error: any) {
      next(error);
    }
  }

  public async restoreClient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, organizationId } = req.params;
      const client = await clientService.restoreClient(id, organizationId);

      const response: ApiResponse = {
        success: true,
        message: 'Client restored successfully',
        data: client
      };

      res.status(200).json(response);
    } catch (error: any) {
      next(error);
    }
  }

  public async searchClients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { organizationId } = req.params;
      const { q: searchTerm } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!searchTerm || typeof searchTerm !== 'string') {
        throw new AppError('Search term is required', 400);
      }

      const result = await clientService.searchClients(organizationId, searchTerm, page, limit);

      const response: ApiResponse = {
        success: true,
        message: 'Clients search completed successfully',
        data: result
      };

      res.status(200).json(response);
    } catch (error: any) {
      next(error);
    }
  }
}

export default new ClientController();