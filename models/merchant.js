import mongoose from 'mongoose';

import genAPIKey from '../util/api.js';
import slugify from '../middleware/slugify.js';

const Schema = mongoose.Schema;

var merchantSchema = new Schema(
    {
        merchantName: {
            type: String,
            required: true
        },
        address1: String,
        address2: String,
        suburb: String,
        postcode: String,
        state: String,
        country: String,
        abn: String,
        acn: String,
        logoUrl: String,
        primaryContact: {
            type: Schema.Types.ObjectId,
            required: true,
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
                    enum: ['Admin', 'User']
                }
            }
        ],
        business: {
            type: Schema.Types.ObjectId,
            ref: 'Business'
        },
        status: {
            type: String,
            enum: ['Draft', 'Pending', 'Active'],
            default: 'Draft'
        },
        categories: {
            merchantType: {
                type: Schema.Types.ObjectId,
                ref: 'MerchantType'
            },
            eComType: {
                type: Schema.Types.ObjectId,
                ref: 'eComType'
            }
        },
        apiKey: {
            type: String,
            required: true,
            default: genAPIKey()
        },
        slug: {
            type: String,
            index: true
        }
    },
    { timestamps: true }
);

merchantSchema.pre('save', async function (next) {
    this.slug = slugify(this.merchantName);
    next();
});

export default mongoose.model('Merchant', merchantSchema);
