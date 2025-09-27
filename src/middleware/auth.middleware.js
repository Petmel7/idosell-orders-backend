const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
    const token =
        req.header('x-admin-token') ||
        req.header('authorization')?.replace(/^Bearer\s+/, '');

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admins only' });
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

module.exports = { requireAdmin };

