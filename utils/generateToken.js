const jwt = require("jsonwebtoken");
const { JWT_KEY } = require("../config/keys");

/**
 * Signs a JWT for a given user/owner payload.
 * @param {Object} payload - data to embed in the token (never include the password!)
 * @param {String} expiresIn - token lifetime, defaults to 7 days
 */
function generateToken(payload, expiresIn = "7d") {
    return jwt.sign(payload, JWT_KEY, { expiresIn });
}

module.exports = generateToken;
