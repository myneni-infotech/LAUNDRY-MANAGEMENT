import { Types } from 'mongoose';
import Organization, { IOrganization } from '../models/Organization';
import { AppError } from '../utils/AppError';

export interface ICreateOrganization {
  name: string;
  description?: string;
  email: string;
  phone?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  industry?: string;
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  logo?: string;
  createdBy: string;
}

export interface IUpdateOrganization {
  name?: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  industry?: string;
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  logo?: string;
  isActive?: boolean;
}

export const createOrganization = async (organizationData: ICreateOrganization): Promise<IOrganization> => {
  try {
    const existingOrganization = await Organization.findOne({ 
      email: organizationData.email,
      isDeleted: false 
    });
    
    if (existingOrganization) {
      throw new AppError('Organization with this email already exists', 400);
    }

    const organization = new Organization({
      ...organizationData,
      createdBy: new Types.ObjectId(organizationData.createdBy)
    });

    await organization.save();
    await organization.populate('createdBy', 'username email firstName lastName');
    
    return organization;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Failed to create organization', 500);
  }
};

export const getAllOrganizations = async (page = 1, limit = 10, filters: any = {}) => {
  try {
    const skip = (page - 1) * limit;
    const query: any = { isDeleted: false };

    if (filters.name) {
      query.name = { $regex: filters.name, $options: 'i' };
    }
    if (filters.industry) {
      query.industry = { $regex: filters.industry, $options: 'i' };
    }
    if (filters.size) {
      query.size = filters.size;
    }
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    const [organizations, total] = await Promise.all([
      Organization.find(query)
        .populate('createdBy', 'username email firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Organization.countDocuments(query)
    ]);

    return {
      organizations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to fetch organizations', 500);
  }
};

export const getOrganizationById = async (id: string): Promise<IOrganization> => {
  try {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid organization ID', 400);
    }

    const organization = await Organization.findOne({ 
      _id: id, 
      isDeleted: false 
    }).populate('createdBy', 'username email firstName lastName');

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    return organization;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Failed to fetch organization', 500);
  }
};

export const updateOrganization = async (
  id: string, 
  updateData: IUpdateOrganization
): Promise<IOrganization> => {
  try {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid organization ID', 400);
    }

    if (updateData.email) {
      const existingOrganization = await Organization.findOne({
        email: updateData.email,
        _id: { $ne: id },
        isDeleted: false
      });

      if (existingOrganization) {
        throw new AppError('Organization with this email already exists', 400);
      }
    }

    const organization = await Organization.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('createdBy', 'username email firstName lastName');

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    return organization;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Failed to update organization', 500);
  }
};

export const deleteOrganization = async (id: string, deletedBy: string): Promise<void> => {
  try {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid organization ID', 400);
    }

    const organization = await Organization.findOne({ 
      _id: id, 
      isDeleted: false 
    });

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    await Organization.findByIdAndUpdate(id, {
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
    throw new AppError(error.message || 'Failed to delete organization', 500);
  }
};

export const restoreOrganization = async (id: string): Promise<IOrganization> => {
  try {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid organization ID', 400);
    }

    const organization = await Organization.findOneAndUpdate(
      { _id: id, isDeleted: true },
      {
        $set: { isDeleted: false, isActive: true },
        $unset: { deletedAt: 1, deletedBy: 1 }
      },
      { new: true }
    ).populate('createdBy', 'username email firstName lastName');

    if (!organization) {
      throw new AppError('Organization not found or not deleted', 404);
    }

    return organization;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Failed to restore organization', 500);
  }
};