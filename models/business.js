import mongoose from 'mongoose';

import genAPIKey from '../util/api.js';
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
        state: String,
        country: String,
        abn: String,
        acn: String,
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
            enum: ['Draft', 'Pending', 'Active'],
            default: 'Draft'
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

businessSchema.pre('save', async function (next) {
    this.slug = slugify(this.name);
    next();
});

export default mongoose.model('Business', businessSchema);
