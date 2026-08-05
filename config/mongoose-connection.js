const mongoose = require("mongoose");
const config = require("config");
const dbgr = require("debug")("development:mongoose");

// Prefer live env var (works well with .env / cloud deploys), fall back to config/*.json
const MONGODB_URL = process.env.MONGODB_URL || config.get("MONGODB_URL");

mongoose
    .connect(`${MONGODB_URL}/Scatch`)
    .then(function () {
        dbgr("✅ MongoDB connected successfully");
        console.log("✅ MongoDB connected successfully");
    })
    .catch(function (err) {
        dbgr("❌ MongoDB connection error:", err);
        console.error("❌ MongoDB connection error:", err.message);
    });

module.exports = mongoose.connection;
