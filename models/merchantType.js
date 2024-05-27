import mongoose from 'mongoose';

import slugify from '../middleware/slugify.js';

const Schema = mongoose.Schema;

var merchantTypeSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        slug: {
            type: String,
            index: true
        }
    },
    { timestamps: true }
);

merchantTypeSchema.pre('save', async function (next) {
    this.slug = slugify(this.name);
    next();
});

export default mongoose.model('MerchantType', merchantTypeSchema);
