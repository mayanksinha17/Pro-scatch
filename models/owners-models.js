const mongoose = require("mongoose");

const ownerSchema = new mongoose.Schema(
    {
        fullname: {
            type: String,
            required: true,
            minlength: 3,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },

        password: {
            type: String,
            required: true,
        },

        products: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
            default: [],
        },

        picture: {
            type: String,
            default: "",
        },

        gstin: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Owner", ownerSchema);
