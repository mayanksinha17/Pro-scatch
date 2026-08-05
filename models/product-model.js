const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        image: {
            type: String,
            default: "",
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        discount: {
            type: Number,
            default: 0,
            min: 0,
        },
        bgcolor: String,
        panelcolor: String,
        textcolor: String,
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Owner",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
