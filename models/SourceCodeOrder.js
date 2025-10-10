const mongoose = require("mongoose");
const shortid = require("shortid");

const SourceCodeOrderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    userId: String,
    username: String,
    avatar: String,
    sourceCodeId: String,
    price: Number,
    status: { type: String, enum: ["pending", "completed", "cancelled"], default: "pending" },
    createdAt: { type: Date, default: Date.now }
});

SourceCodeOrderSchema.pre("validate", function (next) {
    if (!this.orderId) {
        this.orderId = `SCO-${shortid.generate().toUpperCase()}`;
    }
    next();
});

module.exports = mongoose.model("SourceCodeOrder", SourceCodeOrderSchema);