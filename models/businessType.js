import mongoose from 'mongoose';

const Schema = mongoose.Schema;

var businessTypeSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

export default mongoose.model('BusinessType', businessTypeSchema);
