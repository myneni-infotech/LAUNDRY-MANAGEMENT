import { Types } from 'mongoose';
import Collection from '../models/Collection';
import type { ICollection } from '../models/Collection';
import { AppError } from '../utils/AppError';

export interface ICreateCollection {
  organizationId: Types.ObjectId;
  clientId: string;
  collectedBy: Types.ObjectId;
  dateTime?: Date;
  status?: string;
  notes?: string;
  items?: {
    description: string;
    quantity: number;
    category?: string;
  }[];
}

export interface IUpdateCollection {
  status?: string;
  notes?: string;
  items?: {
    description: string;
    quantity: number;
    category?: string;
  }[];
}

export interface ICollectionFilters {
  organizationId: Types.ObjectId;
  status?: string;
  clientId?: string;
  collectedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  userRole?: string;
  userId?: Types.ObjectId;
  userClients?: string[];
}

export interface IPaginationOptions {
  page: number;
  limit: number;
}

// Create a new collection
export const createCollection = async (collectionData: ICreateCollection): Promise<ICollection> => {
  const collection = await Collection.create(collectionData);
  
  await collection.populate([
    { path: 'clientId', select: 'name email clientCode' },
    { path: 'collectedBy', select: 'username firstName lastName' },
    { path: 'organizationId', select: 'name' }
  ]);

  return collection;
};

// Get collections with filters and pagination
export const getCollections = async (
  filters: ICollectionFilters,
  pagination: IPaginationOptions
): Promise<{ collections: ICollection[]; total: number }> => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  // Build filter
  const filter: any = {
    organizationId: filters.organizationId,
    isDeleted: false
  };

  if (filters.status) filter.status = filters.status;
  if (filters.clientId) filter.clientId = filters.clientId;
  if (filters.collectedBy) filter.collectedBy = filters.collectedBy;

  if (filters.dateFrom || filters.dateTo) {
    filter.dateTime = {};
    if (filters.dateFrom) filter.dateTime.$gte = filters.dateFrom;
    if (filters.dateTo) filter.dateTime.$lte = filters.dateTo;
  }

  // Apply role-based filtering for non-admin/manager users
  if (filters.userRole && !['admin', 'manager'].includes(filters.userRole)) {
    filter.$or = [
      { collectedBy: filters.userId },
      { clientId: { $in: filters.userClients || [] } }
    ];
  }

  const collections = await Collection.find(filter)
    .populate([
      { path: 'clientId', select: 'name email clientCode' },
      { path: 'collectedBy', select: 'username firstName lastName' },
      { path: 'organizationId', select: 'name' }
    ])
    .sort({ dateTime: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Collection.countDocuments(filter);

  return { collections, total };
};

// Get collection by ID
export const getCollectionById = async (
  id: string,
  organizationId: Types.ObjectId
): Promise<ICollection> => {
  const collection = await Collection.findOne({
    _id: id,
    organizationId,
    isDeleted: false
  }).populate([
    { path: 'clientId', select: 'name email clientCode address' },
    { path: 'collectedBy', select: 'username firstName lastName email' },
    { path: 'organizationId', select: 'name' },
    { path: 'uploadedDocuments.uploadedBy', select: 'username firstName lastName' },
    { path: 'deletedBy', select: 'username firstName lastName' }
  ]);

  if (!collection) {
    throw new AppError('Collection not found', 404);
  }

  return collection;
};

// Check if user has access to collection
export const checkCollectionAccess = (
  collection: ICollection,
  userId: Types.ObjectId,
  userRole?: string,
  userClients?: string[]
): boolean => {
  // Admin and managers have full access
  if (userRole && ['admin', 'manager'].includes(userRole)) {
    return true;
  }

  // Check if user is the collector or has access to the client
  const isCollector = collection.collectedBy.toString() === userId.toString();
  const hasClientAccess = userClients && userClients.includes(collection.clientId.toString());

  return isCollector || hasClientAccess;
};

// Update collection
export const updateCollection = async (
  id: string,
  organizationId: Types.ObjectId,
  updateData: IUpdateCollection
): Promise<ICollection> => {
  const collection = await Collection.findOne({
    _id: id,
    organizationId,
    isDeleted: false
  });

  if (!collection) {
    throw new AppError('Collection not found', 404);
  }

  // Update fields
  if (updateData.status !== undefined) collection.status = updateData.status as any;
  if (updateData.notes !== undefined) collection.notes = updateData.notes;
  if (updateData.items !== undefined) collection.items = updateData.items;

  await collection.save();
  await collection.populate([
    { path: 'clientId', select: 'name email clientCode' },
    { path: 'collectedBy', select: 'username firstName lastName' },
    { path: 'organizationId', select: 'name' }
  ]);

  return collection;
};

// Delete collection (soft delete)
export const deleteCollection = async (
  id: string,
  organizationId: Types.ObjectId,
  deletedBy: Types.ObjectId
): Promise<void> => {
  const collection = await Collection.findOne({
    _id: id,
    organizationId,
    isDeleted: false
  });

  if (!collection) {
    throw new AppError('Collection not found', 404);
  }

  await collection.softDelete(deletedBy);
};

// Get collections by client
export const getCollectionsByClient = async (
  clientId: string,
  organizationId: Types.ObjectId,
  pagination: IPaginationOptions
): Promise<{ collections: ICollection[]; total: number }> => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const collections = await Collection.find({
    organizationId,
    clientId,
    isDeleted: false
  })
    .populate([
      { path: 'clientId', select: 'name email clientCode' },
      { path: 'collectedBy', select: 'username firstName lastName' }
    ])
    .sort({ dateTime: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Collection.countDocuments({
    organizationId,
    clientId,
    isDeleted: false
  });

  return { collections, total };
};

// Get collections by status
export const getCollectionsByStatus = async (
  status: string,
  filters: ICollectionFilters,
  pagination: IPaginationOptions
): Promise<{ collections: ICollection[]; total: number }> => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const filter: any = {
    organizationId: filters.organizationId,
    status,
    isDeleted: false
  };

  // Apply role-based filtering for non-admin/manager users
  if (filters.userRole && !['admin', 'manager'].includes(filters.userRole)) {
    filter.$or = [
      { collectedBy: filters.userId },
      { clientId: { $in: filters.userClients || [] } }
    ];
  }

  const collections = await Collection.find(filter)
    .populate([
      { path: 'clientId', select: 'name email clientCode' },
      { path: 'collectedBy', select: 'username firstName lastName' }
    ])
    .sort({ dateTime: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Collection.countDocuments(filter);

  return { collections, total };
};

// Validate user can create collection for client
export const validateClientAccess = (userClients: string[], clientId: string): boolean => {
  return userClients.includes(clientId);
};

// Check if user can delete collection
export const canDeleteCollection = (
  collection: ICollection,
  userId: Types.ObjectId,
  userRole?: string
): boolean => {
  // Admin/manager can delete any collection
  if (userRole && ['admin', 'manager'].includes(userRole)) {
    return true;
  }

  // Only the collector can delete their own collection
  return collection.collectedBy.toString() === userId.toString();
};

// Get collection statistics
export const getCollectionStats = async (
  organizationId: Types.ObjectId,
  filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    clientId?: string;
    collectedBy?: string;
  }
): Promise<{
  totalCollections: number;
  statusCounts: Record<string, number>;
  recentCollections: ICollection[];
}> => {
  const baseFilter: any = {
    organizationId,
    isDeleted: false
  };

  if (filters?.dateFrom || filters?.dateTo) {
    baseFilter.dateTime = {};
    if (filters.dateFrom) baseFilter.dateTime.$gte = filters.dateFrom;
    if (filters.dateTo) baseFilter.dateTime.$lte = filters.dateTo;
  }

  if (filters?.clientId) baseFilter.clientId = filters.clientId;
  if (filters?.collectedBy) baseFilter.collectedBy = filters.collectedBy;

  // Get total count
  const totalCollections = await Collection.countDocuments(baseFilter);

  // Get status counts
  const statusAggregation = await Collection.aggregate([
    { $match: baseFilter },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const statusCounts: Record<string, number> = {};
  statusAggregation.forEach(item => {
    statusCounts[item._id] = item.count;
  });

  // Get recent collections
  const recentCollections = await Collection.find(baseFilter)
    .populate([
      { path: 'clientId', select: 'name clientCode' },
      { path: 'collectedBy', select: 'username firstName lastName' }
    ])
    .sort({ dateTime: -1 })
    .limit(10);

  return {
    totalCollections,
    statusCounts,
    recentCollections
  };
};

export default {
  createCollection,
  getCollections,
  getCollectionById,
  checkCollectionAccess,
  updateCollection,
  deleteCollection,
  getCollectionsByClient,
  getCollectionsByStatus,
  validateClientAccess,
  canDeleteCollection,
  getCollectionStats
};