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
        business: {
            business: {
                type: Schema.Types.ObjectId,
                ref: 'business'
            },
            access: {
                type: String,
                enum: ['Admin', 'User', 'Child']
            }
        },
        merchants: [
            {
                merchant: {
                    type: Schema.Types.ObjectId,
                    ref: 'business'
                },
                access: {
                    type: String,
                    enum: ['Admin', 'User']
                }
            }
        ]
    },
    { timestamps: true }
);

export default mongoose.model('BusinessUser', businessUserSchema);
