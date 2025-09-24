const mongoose = require('mongoose');


const ProductSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    quantity: { type: Number, required: true },
});


const OrderSchema = new mongoose.Schema({
    orderNumber: { type: String, required: true, unique: true },
    products: { type: [ProductSchema], default: [] },
    totalAmount: { type: Number, required: true },
    status: { type: String, required: true },
    raw: { type: Object },
    lastSyncedAt: { type: Date, default: Date.now },
}, { timestamps: true });


module.exports = mongoose.model('Order', OrderSchema);
