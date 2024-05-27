import mongoose from 'mongoose';

const Schema = mongoose.Schema;

var consumerSchema = new Schema(
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
        },
        dateOfBirth: {
            type: Date
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other', 'NotSay']
        },
        address1: {
            type: String
        },
        address2: {
            type: String
        },
        suburb: {
            type: String
        },
        postcode: {
            type: String
        },
        state: {
            type: String
        },
        country: {
            type: String
        }
    },
    { timestamps: true }
);

export default mongoose.model('Consumer', consumerSchema);
