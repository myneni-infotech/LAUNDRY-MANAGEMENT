import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { ApiResponse, AuthenticatedRequest } from '../types/api';
import { AppError } from '../utils/AppError';
import * as collectionService from '../services/collectionService';

// Helper function to extract organization ID from user object
const getOrganizationId = (user: any): Types.ObjectId => {
  // If organization is populated, use _id, otherwise use the ObjectId directly
  return user.organization._id || user.organization;
};

export interface CreateCollectionRequest {
  clientId: string;
  dateTime?: Date;
  status?: string;
  notes?: string;
  items?: {
    description: string;
    quantity: number;
    category?: string;
  }[];
}

export interface UpdateCollectionRequest {
  status?: string;
  notes?: string;
  items?: {
    description: string;
    quantity: number;
    category?: string;
  }[];
}

class CollectionController {

  public async createCollection(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }


      const { clientId, dateTime, status, notes, items }: CreateCollectionRequest = req.body;

      // Validate client access
      const clientIds = (req.user.clients || []).map((id: any) => id.toString());
      if (!collectionService.validateClientAccess(clientIds, clientId)) {
        throw new AppError('You are not authorized to create collections for this client', 403);
      }

      const collectionData: collectionService.ICreateCollection = {
        organizationId: getOrganizationId(req.user),
        clientId,
        collectedBy: req.user._id,
        dateTime: dateTime || new Date(),
        status: status || 'pending',
        notes,
        items
      };

      const collection = await collectionService.createCollection(collectionData);

      const response: ApiResponse = {
        success: true,
        message: 'Collection created successfully',
        data: collection
      };

      res.status(201).json(response);
    } catch (error: any) {
      next(error);
    }
  }

  // get only user client collections
  public async getUserClientCollections(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const clientIds = (req.user.clients || []).map((id: any) => id.toString());
      const collections = await collectionService.getUserClientCollections(userId, clientIds);

      const response: ApiResponse = {
        success: true,
        message: 'User client collections retrieved successfully',
        data: collections
      };

      res.json(response);
    } catch (error: any) {
      next(error);
    }
  }

  public async getAllCollections(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const {
        page = 1,
        limit = 10,
        status,
        clientId,
        collectedBy,
        dateFrom,
        dateTo,
        search
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const filters: collectionService.ICollectionFilters = {
        organizationId: getOrganizationId(req.user),
        status: status as string,
        clientId: clientId as string,
        collectedBy: collectedBy as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        search: search as string,
        userRole: req.user.role,
        userId: req.user._id,
        userClients: req.user.clients || []
      };

      const pagination: collectionService.IPaginationOptions = {
        page: pageNum,
        limit: limitNum
      };

      const { collections, total } = await collectionService.getCollections(filters, pagination);

      const response: ApiResponse = {
        success: true,
        message: 'Collections retrieved successfully',
        data: collections,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1
        }
      };

      res.json(response);
    } catch (error: any) {
      next(error);
    }
  }

  public async getCollectionById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { id } = req.params;
      const collection = await collectionService.getCollectionById(id, getOrganizationId(req.user));

      // Check access rights for non-admin/manager users
      if (!collectionService.checkCollectionAccess(collection, req.user._id, req.user.role, req.user.clients)) {
        throw new AppError('You are not authorized to view this collection', 403);
      }

      const response: ApiResponse = {
        success: true,
        message: 'Collection retrieved successfully',
        data: collection
      };

      res.json(response);
    } catch (error: any) {
      next(error);
    }
  }

  public async updateCollection(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { id } = req.params;
      const { status, notes, items }: UpdateCollectionRequest = req.body;

      // Check access first by getting the collection
      const existingCollection = await collectionService.getCollectionById(id, getOrganizationId(req.user));

      if (!collectionService.checkCollectionAccess(existingCollection, req.user._id, req.user.role, req.user.clients)) {
        throw new AppError('You are not authorized to update this collection', 403);
      }

      const updateData: collectionService.IUpdateCollection = {
        status,
        notes,
        items
      };

      const collection = await collectionService.updateCollection(id, getOrganizationId(req.user), updateData);

      const response: ApiResponse = {
        success: true,
        message: 'Collection updated successfully',
        data: collection
      };

      res.json(response);
    } catch (error: any) {
      next(error);
    }
  }

  public async deleteCollection(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { id } = req.params;


      const clientIds = (req.user.clients || []).map((id: any) => id.toString());
      if (!collectionService.validateClientAccess(clientIds, id)) {
        throw new AppError('You are not authorized to view collections for this client', 403);
      }

      // Check if collection exists and user can delete it
      const collection = await collectionService.getCollectionById(id, getOrganizationId(req.user));

      if (!collectionService.canDeleteCollection(collection, req.user._id, req.user.role)) {
        throw new AppError('You are not authorized to delete this collection', 403);
      }

      await collectionService.deleteCollection(id, getOrganizationId(req.user), req.user._id);

      const response: ApiResponse = {
        success: true,
        message: 'Collection deleted successfully'
      };

      res.json(response);
    } catch (error: any) {
      next(error);
    }
  }



  public async getCollectionsByClient(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { clientId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const clientIds = (req.user.clients || []).map((id: any) => id.toString());
      if (!collectionService.validateClientAccess(clientIds, clientId)) {
        throw new AppError('You are not authorized to view collections for this client', 403);
      }


      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const pagination: collectionService.IPaginationOptions = {
        page: pageNum,
        limit: limitNum
      };

      const { collections, total } = await collectionService.getCollectionsByClient(
        clientId,
        getOrganizationId(req.user),
        pagination
      );

      const response: ApiResponse = {
        success: true,
        message: 'Collections retrieved successfully',
        data: collections,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1
        }
      };

      res.json(response);
    } catch (error: any) {
      next(error);
    }
  }

  public async getCollectionsByStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { status } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const filters: collectionService.ICollectionFilters = {
        organizationId: getOrganizationId(req.user),
        userRole: req.user.role,
        userId: req.user._id,
        userClients: req.user.clients || []
      };

      const pagination: collectionService.IPaginationOptions = {
        page: pageNum,
        limit: limitNum
      };

      const { collections, total } = await collectionService.getCollectionsByStatus(
        status,
        filters,
        pagination
      );

      const response: ApiResponse = {
        success: true,
        message: 'Collections retrieved successfully',
        data: collections,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1
        }
      };

      res.json(response);
    } catch (error: any) {
      next(error);
    }
  }

  public async getCollectionStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { dateFrom, dateTo, clientId, collectedBy } = req.query;

      const filters = {
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        clientId: clientId as string,
        collectedBy: collectedBy as string
      };

      const stats = await collectionService.getCollectionStats(getOrganizationId(req.user), filters);

      const response: ApiResponse = {
        success: true,
        message: 'Collection statistics retrieved successfully',
        data: stats
      };

      res.json(response);
    } catch (error: any) {
      next(error);
    }
  }
}

// Create and export controller instance
const collectionController = new CollectionController();

export const createCollection = collectionController.createCollection.bind(collectionController);
export const getAllCollections = collectionController.getAllCollections.bind(collectionController);
export const getCollectionById = collectionController.getCollectionById.bind(collectionController);
export const updateCollection = collectionController.updateCollection.bind(collectionController);
export const deleteCollection = collectionController.deleteCollection.bind(collectionController);
export const getCollectionsByClient = collectionController.getCollectionsByClient.bind(collectionController);
export const getCollectionsByStatus = collectionController.getCollectionsByStatus.bind(collectionController);
export const getCollectionStats = collectionController.getCollectionStats.bind(collectionController);

export default collectionController;