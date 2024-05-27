import mongoose from 'mongoose';
import currency from 'mongoose-currency';

const Schema = mongoose.Schema;
currency.loadType(mongoose);
const Currency = mongoose.Types.Currency;

var itemSchema = new Schema(
    {
        sku: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        itemType: {
            type: Schema.Types.ObjectId,
            ref: 'ItemType'
        },
        manufacturer: String,
        rrp: Currency,
        productImageUrl: String,
        manualUrl: String
    },
    { timestamps: true }
);

export default mongoose.model('Item', itemSchema);
