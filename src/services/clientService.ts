import { Types } from 'mongoose';
import Client from '../models/Client';
import type { IClient } from '../models/Client';
import { AppError } from '../utils/AppError';

export interface ICreateClient {
  name: string;
  aliasName?: string;
  clientCode?: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    landmark?: string;
  };
  clientType: 'individual' | 'business' | 'hotel' | 'restaurant' | 'hospital' | 'other';
  contactPerson?: {
    name: string;
    designation?: string;
    phone?: string;
    email?: string;
  };
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  taxInfo?: {
    gstNumber?: string;
    panNumber?: string;
  };
  paymentTerms?: string;
  creditLimit?: number;
  notes?: string;
  preferredPickupTime?: string;
  preferredDeliveryTime?: string;
  organizationId: string;
  createdBy: string;
}

export interface IUpdateClient {
  name?: string;
  aliasName?: string;
  clientCode?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    landmark?: string;
  };
  clientType?: 'individual' | 'business' | 'hotel' | 'restaurant' | 'hospital' | 'other';
  contactPerson?: {
    name?: string;
    designation?: string;
    phone?: string;
    email?: string;
  };
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  taxInfo?: {
    gstNumber?: string;
    panNumber?: string;
  };
  paymentTerms?: string;
  creditLimit?: number;
  notes?: string;
  preferredPickupTime?: string;
  preferredDeliveryTime?: string;
  isActive?: boolean;
}

export const createClient = async (clientData: ICreateClient): Promise<IClient> => {
  try {
    const existingClient = await Client.findOne({
      email: clientData.email,
      organizationId: clientData.organizationId,
      isDeleted: false
    });

    if (existingClient) {
      throw new AppError('Client with this email already exists in the organization', 400);
    }

    const client = new Client({
      ...clientData,
      organizationId: new Types.ObjectId(clientData.organizationId),
      createdBy: new Types.ObjectId(clientData.createdBy)
    });

    await client.save();
    await client.populate([
      { path: 'createdBy', select: 'username email firstName lastName' },
      { path: 'organizationId', select: 'name email' }
    ]);

    return client;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Failed to create client', 500);
  }
};

export const getAllClients = async (
  organizationId: string,
  page = 1, 
  limit = 10, 
  filters: any = {}
) => {
  try {
    const skip = (page - 1) * limit;
    const query: any = { 
      organizationId: new Types.ObjectId(organizationId),
      isDeleted: false 
    };

    if (filters.name) {
      query.name = { $regex: filters.name, $options: 'i' };
    }
    if (filters.email) {
      query.email = { $regex: filters.email, $options: 'i' };
    }
    if (filters.phone) {
      query.phone = { $regex: filters.phone, $options: 'i' };
    }
    if (filters.clientType) {
      query.clientType = filters.clientType;
    }
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }
    if (filters.city) {
      query['address.city'] = { $regex: filters.city, $options: 'i' };
    }
    if (filters.state) {
      query['address.state'] = { $regex: filters.state, $options: 'i' };
    }

    const [clients, total] = await Promise.all([
      Client.find(query)
        .populate('createdBy', 'username email firstName lastName')
        .populate('organizationId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Client.countDocuments(query)
    ]);

    return {
      clients,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to fetch clients', 500);
  }
};

export const getClientById = async (id: string, organizationId?: string): Promise<IClient> => {
  try {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid client ID', 400);
    }

    const query: any = { 
      _id: id, 
      isDeleted: false 
    };

    if (organizationId) {
      query.organizationId = new Types.ObjectId(organizationId);
    }

    const client = await Client.findOne(query)
      .populate('createdBy', 'username email firstName lastName')
      .populate('organizationId', 'name email');

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    return client;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Failed to fetch client', 500);
  }
};

export const updateClient = async (
  id: string, 
  updateData: IUpdateClient,
  organizationId?: string
): Promise<IClient> => {
  try {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid client ID', 400);
    }

    const query: any = { 
      _id: id, 
      isDeleted: false 
    };

    if (organizationId) {
      query.organizationId = new Types.ObjectId(organizationId);
    }

    if (updateData.email && organizationId) {
      const existingClient = await Client.findOne({
        email: updateData.email,
        organizationId: new Types.ObjectId(organizationId),
        _id: { $ne: id },
        isDeleted: false
      });

      if (existingClient) {
        throw new AppError('Client with this email already exists in the organization', 400);
      }
    }

    const client = await Client.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'username email firstName lastName')
      .populate('organizationId', 'name email');

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    return client;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Failed to update client', 500);
  }
};

export const deleteClient = async (
  id: string, 
  deletedBy: string, 
  organizationId?: string
): Promise<void> => {
  try {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid client ID', 400);
    }

    const query: any = { 
      _id: id, 
      isDeleted: false 
    };

    if (organizationId) {
      query.organizationId = new Types.ObjectId(organizationId);
    }

    const client = await Client.findOne(query);

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    await Client.findByIdAndUpdate(id, {
      $set: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
        deletedBy: new Types.ObjectId(deletedBy)
      }
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Failed to delete client', 500);
  }
};

export const restoreClient = async (id: string, organizationId?: string): Promise<IClient> => {
  try {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid client ID', 400);
    }

    const query: any = { 
      _id: id, 
      isDeleted: true 
    };

    if (organizationId) {
      query.organizationId = new Types.ObjectId(organizationId);
    }

    const client = await Client.findOneAndUpdate(
      query,
      {
        $set: { isDeleted: false, isActive: true },
        $unset: { deletedAt: 1, deletedBy: 1 }
      },
      { new: true }
    )
      .populate('createdBy', 'username email firstName lastName')
      .populate('organizationId', 'name email');

    if (!client) {
      throw new AppError('Client not found or not deleted', 404);
    }

    return client;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Failed to restore client', 500);
  }
};

export const searchClients = async (
  organizationId: string,
  searchTerm: string,
  page = 1,
  limit = 10
) => {
  try {
    const skip = (page - 1) * limit;
    const query = {
      organizationId: new Types.ObjectId(organizationId),
      isDeleted: false,
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { aliasName: { $regex: searchTerm, $options: 'i' } },
        { clientCode: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } },
        { 'contactPerson.name': { $regex: searchTerm, $options: 'i' } }
      ]
    };

    const [clients, total] = await Promise.all([
      Client.find(query)
        .populate('createdBy', 'username email firstName lastName')
        .populate('organizationId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Client.countDocuments(query)
    ]);

    return {
      clients,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to search clients', 500);
  }
};