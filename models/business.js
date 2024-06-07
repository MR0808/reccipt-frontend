import mongoose from 'mongoose';

import slugify from '../middleware/slugify.js';

const Schema = mongoose.Schema;

var businessSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        phoneNumber: String,
        genericEmail: String,
        address1: String,
        address2: String,
        suburb: String,
        postcode: String,
        state: {
            type: Schema.Types.ObjectId,
            ref: 'State'
        },
        country: {
            type: Schema.Types.ObjectId,
            ref: 'Country'
        },
        abn: String,
        acn: String,
        primaryContact: {
            type: Schema.Types.ObjectId,
            ref: 'BusinessUser'
        },
        users: [
            {
                user: {
                    type: Schema.Types.ObjectId,
                    ref: 'BusinessUser'
                },
                access: {
                    type: String,
                    enum: ['Admin', 'User', 'Child']
                }
            }
        ],
        merchants: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Merchant'
            }
        ],
        status: {
            type: String,
            enum: ['Draft', 'Pending', 'Active', 'Inactive'],
            default: 'Draft'
        },
        apiKey: String,
        slug: {
            type: String,
            index: true
        }
    },
    { timestamps: true }
);

businessSchema.index({ name: 'text', name: 'text' });

businessSchema.pre('save', async function (next) {
    this.slug = slugify(this.name);
    next();
});

export default mongoose.model('Business', businessSchema);
