import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICollection extends Document {
  _id: Types.ObjectId;
  collectionCode: string;
  organizationId: Types.ObjectId;
  clientId: Types.ObjectId;
  dateTime: Date;
  collectedBy: Types.ObjectId;
  status?: 'pending' | 'collected' | 'in_transit' | 'washing' | 'packing' | 'delivered' | 'cancelled';
  notes?: string;
  items?: {
    description: string;
    quantity: number;
    category?: string;
  }[];
  // uploaded collected physical documents
  uploadedDocuments?: {
    fileName: string;
    filePath: string;
    uploadedBy: Types.ObjectId;
    uploadedAt: Date;
  }[];
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  softDelete(deletedBy: Types.ObjectId): Promise<ICollection>;
  restore(): Promise<ICollection>;
}

const CollectionSchema = new Schema<ICollection>({
  collectionCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 20
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  dateTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  uploadedDocuments: [{
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  collectedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'collected', 'in_transit', 'washing', 'packing', 'delivered', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  items: [{
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    category: {
      type: String,
      trim: true,
      maxlength: 50
    }
  }],
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
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for better performance
CollectionSchema.index({ collectionCode: 1, organizationId: 1 }, { unique: true });
CollectionSchema.index({ organizationId: 1, isDeleted: 1, isActive: 1 });
CollectionSchema.index({ clientId: 1, dateTime: -1 });
CollectionSchema.index({ collectedBy: 1, dateTime: -1 });
CollectionSchema.index({ status: 1 });
CollectionSchema.index({ dateTime: -1 });

// Virtual for total items count
CollectionSchema.virtual('totalItems').get(function () {
  return this.items?.reduce((total, item) => total + item.quantity, 0) || 0;
});

// Static method to find active collections
CollectionSchema.statics.findActive = function (organizationId: Types.ObjectId) {
  return this.find({
    organizationId,
    isActive: true,
    isDeleted: false
  });
};

// Static method to find collections by status
CollectionSchema.statics.findByStatus = function (organizationId: Types.ObjectId, status: string) {
  return this.find({
    organizationId,
    status,
    isActive: true,
    isDeleted: false
  });
};

// Static method to find collections by client
CollectionSchema.statics.findByClient = function (organizationId: Types.ObjectId, clientId: Types.ObjectId) {
  return this.find({
    organizationId,
    clientId,
    isActive: true,
    isDeleted: false
  }).sort({ dateTime: -1 });
};

// Static method to find collections by collector
CollectionSchema.statics.findByCollector = function (organizationId: Types.ObjectId, collectedBy: Types.ObjectId) {
  return this.find({
    organizationId,
    collectedBy,
    isActive: true,
    isDeleted: false
  }).sort({ dateTime: -1 });
};

// Instance method to soft delete
CollectionSchema.methods.softDelete = function (deletedBy: Types.ObjectId) {
  this.isDeleted = true;
  this.isActive = false;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

// Instance method to restore
CollectionSchema.methods.restore = function () {
  this.isDeleted = false;
  this.isActive = true;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  return this.save();
};

// Pre-save middleware to generate collection code if not provided
CollectionSchema.pre('save', async function (next) {
  if (this.isNew && !this.collectionCode) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Find the last collection code for today
    const lastCollection = await mongoose.model('Collection').findOne({
      organizationId: this.organizationId,
      collectionCode: { $regex: `^COL${year}${month}${day}` }
    }).sort({ collectionCode: -1 });

    let sequence = 1;
    if (lastCollection) {
      const lastSequence = parseInt(lastCollection.collectionCode.slice(-4));
      sequence = lastSequence + 1;
    }

    this.collectionCode = `COL${year}${month}${day}${String(sequence).padStart(4, '0')}`;
  }
  next();
});

const Collection = mongoose.model<ICollection>('Collection', CollectionSchema);

export default Collection;
export type { ICollection };