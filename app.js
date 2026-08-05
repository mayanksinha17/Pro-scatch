const express = require("express");
const app = express();

const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

// Database Connection
require("./config/mongoose-connection");

// Routes
const ownersRouter = require("./routes/OwnersRouter");
const ushersRouter = require("./routes/UshersRouter");
const productsRouter = require("./routes/ProductsRouter");
const indexRouter = require("./routes/index");
const { attachUser } = require("./middlewares/auth");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Decode JWT (if present) for every request so views know the login state
app.use(attachUser);

// Routes
app.use("/owners", ownersRouter);
app.use("/ushers", ushersRouter);
app.use("/products", productsRouter);
app.use("/", indexRouter);

// 404 handler - must come after all routes
// Renders a page for normal browser navigation, JSON for API/AJAX callers.
app.use(function (req, res) {
    if (req.accepts("html")) {
        return res.status(404).render("errors/404");
    }
    res.status(404).json({ message: "Route not found" });
});

// Centralized error handler - catches anything passed to next(err)
app.use(function (err, req, res, next) {
    console.error(err.stack);
    const status = err.status || 500;
    if (req.accepts("html")) {
        return res.status(status).render("errors/500", { error: err });
    }
    res.status(status).json({ message: err.message || "Internal Server Error" });
});

// Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});

module.exports = app;
