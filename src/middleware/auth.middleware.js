
const config = require('../config');

function requireAdmin(req, res, next) {
    // In development mode, skip without checking
    if (process.env.NODE_ENV === 'development') {
        console.log('🧪 Dev mode → skipping admin check');
        return next();
    }

    const token =
        req.header('x-admin-token') ||
        req.header('authorization')?.replace(/^Bearer\s+/, '');

    console.log('🪙 Received token:', token);

    if (!token || token !== config.adminToken) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    next();
}

module.exports = { requireAdmin };