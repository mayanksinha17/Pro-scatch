const jwt = require("jsonwebtoken");
const { JWT_KEY } = require("../config/keys");
const OwnerModel = require("../models/owners-models");
const UsherModel = require("../models/ushermodel");

/**
 * Generic JWT verification - reads the "token" cookie, verifies it,
 * and attaches the decoded payload to req.user.
 */
function verifyToken(req, res, next) {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized: no token provided" });
        }

        const decoded = jwt.verify(token, JWT_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized: invalid or expired token" });
    }
}

/**
 * Ensures the logged-in token belongs to an Owner (used to protect
 * product-management routes).
 */
async function isOwnerLoggedIn(req, res, next) {
    verifyToken(req, res, async () => {
        try {
            const owner = await OwnerModel.findById(req.user.id);
            if (!owner) {
                return res.status(401).json({ message: "Unauthorized: owner not found" });
            }
            req.owner = owner;
            next();
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    });
}

/**
 * Ensures the logged-in token belongs to an Usher (used to protect
 * cart/order/profile routes).
 */
async function isUsherLoggedIn(req, res, next) {
    verifyToken(req, res, async () => {
        try {
            const usher = await UsherModel.findById(req.user.id);
            if (!usher) {
                return res.status(401).json({ message: "Unauthorized: usher not found" });
            }
            req.usher = usher;
            next();
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    });
}

/**
 * Non-blocking: decodes the JWT cookie if present and exposes it as
 * res.locals.loggedInUser so every EJS view (navbar, profile links, etc.)
 * can render login-state without an extra client-side request.
 * Never rejects the request - if there's no/invalid token, loggedInUser is null.
 */
function attachUser(req, res, next) {
    res.locals.loggedInUser = null;
    const token = req.cookies && req.cookies.token;
    if (token) {
        try {
            res.locals.loggedInUser = jwt.verify(token, JWT_KEY);
        } catch (err) {
            res.locals.loggedInUser = null;
        }
    }
    next();
}

module.exports = { verifyToken, isOwnerLoggedIn, isUsherLoggedIn, attachUser };
