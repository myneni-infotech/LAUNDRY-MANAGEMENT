import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IClient extends Document {
  _id: Types.ObjectId;
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
  organizationId: Types.ObjectId;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  aliasName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  clientCode: {
    type: String,
    trim: true,
    maxlength: 20,
    uppercase: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(phone: string) {
        return /^[\+]?[1-9][\d]{0,15}$/.test(phone);
      },
      message: 'Please provide a valid phone number'
    }
  },
  alternatePhone: {
    type: String,
    trim: true,
    validate: {
      validator: function(phone: string) {
        return !phone || /^[\+]?[1-9][\d]{0,15}$/.test(phone);
      },
      message: 'Please provide a valid alternate phone number'
    }
  },
  address: {
    street: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    zipCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: 100
    }
  },
  clientType: {
    type: String,
    enum: ['individual', 'business', 'hotel', 'restaurant', 'hospital', 'other'],
    required: true,
    default: 'business'
  },
  contactPerson: {
    name: {
      type: String,
      trim: true,
      maxlength: 100
    },
    designation: {
      type: String,
      trim: true,
      maxlength: 50
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function(phone: string) {
          return !phone || /^[\+]?[1-9][\d]{0,15}$/.test(phone);
        },
        message: 'Please provide a valid contact person phone number'
      }
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(email: string) {
          return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Please provide a valid contact person email address'
      }
    }
  },
  billingAddress: {
    street: {
      type: String,
      trim: true,
      maxlength: 200
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100
    },
    state: {
      type: String,
      trim: true,
      maxlength: 100
    },
    country: {
      type: String,
      trim: true,
      maxlength: 100
    },
    zipCode: {
      type: String,
      trim: true,
      maxlength: 20
    }
  },
  taxInfo: {
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 15
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 10
    }
  },
  paymentTerms: {
    type: String,
    trim: true,
    maxlength: 100
  },
  creditLimit: {
    type: Number,
    min: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  preferredPickupTime: {
    type: String,
    trim: true,
    maxlength: 50
  },
  preferredDeliveryTime: {
    type: String,
    trim: true,
    maxlength: 50
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for better performance
ClientSchema.index({ email: 1, organizationId: 1 });
ClientSchema.index({ phone: 1, organizationId: 1 });
ClientSchema.index({ name: 1 });
ClientSchema.index({ clientCode: 1, organizationId: 1 });
ClientSchema.index({ organizationId: 1, isDeleted: 1, isActive: 1 });
ClientSchema.index({ clientType: 1 });
ClientSchema.index({ createdBy: 1 });

// Compound index for unique email per organization
ClientSchema.index({ email: 1, organizationId: 1, isDeleted: 1 }, { unique: true });
// Compound index for unique client code per organization
ClientSchema.index({ clientCode: 1, organizationId: 1, isDeleted: 1 }, { unique: true, sparse: true });

// Virtual for display name (alias or name)
ClientSchema.virtual('displayName').get(function() {
  return this.aliasName || this.name;
});

// Virtual for full address
ClientSchema.virtual('fullAddress').get(function() {
  const address = this.address;
  if (!address) return '';
  
  const parts = [
    address.street,
    address.landmark,
    address.city,
    address.state,
    address.zipCode,
    address.country
  ].filter(Boolean);
  
  return parts.join(', ');
});

// Static method to find active clients
ClientSchema.statics.findActive = function(organizationId: Types.ObjectId) {
  return this.find({ 
    organizationId,
    isActive: true, 
    isDeleted: false 
  });
};

// Static method to find clients by type
ClientSchema.statics.findByType = function(organizationId: Types.ObjectId, clientType: string) {
  return this.find({ 
    organizationId,
    clientType, 
    isActive: true, 
    isDeleted: false 
  });
};

// Instance method to soft delete
ClientSchema.methods.softDelete = function(deletedBy: Types.ObjectId) {
  this.isDeleted = true;
  this.isActive = false;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

// Instance method to restore
ClientSchema.methods.restore = function() {
  this.isDeleted = false;
  this.isActive = true;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  return this.save();
};

export default mongoose.model<IClient>('Client', ClientSchema);