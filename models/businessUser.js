import mongoose from 'mongoose';

const Schema = mongoose.Schema;

var businessUserSchema = new Schema(
    {
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        phoneNumber: String,
        email: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['Admin', 'User']
        },
        business: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Business'
        }
    },
    { timestamps: true }
);

export default mongoose.model('BusinessUser', businessUserSchema);
