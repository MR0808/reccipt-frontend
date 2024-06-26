import mongoose from 'mongoose';

import slugify from '../middleware/slugify.js';

const Schema = mongoose.Schema;

var ecomTypeSchema = new Schema(
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

ecomTypeSchema.pre('save', async function (next) {
    this.slug = slugify(this.name);
    next();
});

export default mongoose.model('EcomType', ecomTypeSchema);
