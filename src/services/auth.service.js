const User = require('../models/user.model');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');

async function registerUser({ email, password, name, role }) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error("User already exists");
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
        email,
        password: hashedPassword,
        name: name || null,
        role: role || 'user', // дозволяємо вказати, але дефолт - user
    });

    const token = generateToken(user);

    return {
        token,
        user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
    };
}

async function loginUser({ email, password }) {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error("Invalid credentials");
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
        throw new Error("Invalid credentials");
    }

    const token = generateToken(user);

    return {
        token,
        user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
    };
}

module.exports = { registerUser, loginUser };
