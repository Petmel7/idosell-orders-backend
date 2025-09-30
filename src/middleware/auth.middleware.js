
const { verifyToken } = require('../utils/jwt');

function requireAuth(req, res, next) {
    const token =
        req.header('authorization')?.replace(/^Bearer\s+/, '') ||
        req.header('x-access-token');

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = verifyToken(token);
        req.user = decoded; // { userId, role }
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }
        next();
    });
}

module.exports = { requireAuth, requireAdmin };
