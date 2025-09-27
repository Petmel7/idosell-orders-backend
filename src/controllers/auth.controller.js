const authService = require('../services/auth.service');

async function register(req, res, next) {
    try {
        const { email, password, name, role } = req.body;
        const { user, token } = await authService.registerUser({ email, password, name, role });
        res.status(201).json({ message: "User registered successfully", user, token });
    } catch (error) {
        next(error);
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const { user, token } = await authService.loginUser({ email, password });
        res.status(200).json({ message: "Login successful", user, token });
    } catch (error) {
        next(error);
    }
}

module.exports = { register, login };
