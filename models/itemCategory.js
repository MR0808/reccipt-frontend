import mongoose from 'mongoose';

import slugify from '../middleware/slugify.js';

const Schema = mongoose.Schema;

var itemCategorySchema = new Schema(
    {
        name: String,
        slug: {
            type: String,
            index: true
        },
        parent: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            ref: 'Category'
        },
        ancestors: [
            {
                _id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Category',
                    index: true
                },
                name: String,
                slug: String
            }
        ]
    },
    { timestamps: true }
);

itemCategorySchema.pre('save', async function (next) {
    this.slug = slugify(this.name);
    next();
});

export default mongoose.model('ItemCategory', itemCategorySchema);
