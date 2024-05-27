import mongoose from 'mongoose';

const Schema = mongoose.Schema;

var merchantUserSchema = new Schema(
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
        merchant: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Merchant'
        }
    },
    { timestamps: true }
);

export default mongoose.model('MerchantUser', merchantUserSchema);
