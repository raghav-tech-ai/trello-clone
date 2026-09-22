require("dotenv").config();
const jwt = require("jsonwebtoken");

function authmiddleware(req, res, next) {
    const token = req.headers.token;

    if (!token) {
        res.status(403).json({
            message: "token is missing"
        });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        req.userId = userId;
        next();
    } catch (e) {
        res.status(403).json({
            message: "token is incorrect"
        });
    }
}

module.exports = {
    authmiddleware
};