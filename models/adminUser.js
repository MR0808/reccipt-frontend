import mongoose from 'mongoose';

const Schema = mongoose.Schema;

var adminUserSchema = new Schema(
    {
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        phoneNumber: {
            type: String,
            require: true
        },
        email: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

export default mongoose.model('AdminUser', adminUserSchema);
