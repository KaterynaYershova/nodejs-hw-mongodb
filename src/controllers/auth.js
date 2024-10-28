import bcrypt from 'bcrypt';
import createHttpError from 'create-http-error';
import User from '../models/user.js';
import Session from '../models/session.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const register = async (req, res, next) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw createHttpError(409, 'Email in use');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            status: 'success',
            message: 'Successfully registered a user!',
            data: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw createHttpError(401, 'Invalid email or password');
        }

        const accessToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

        await Session.findOneAndDelete({ userId: user._id });
        await Session.create({
            userId: user._id,
            accessToken,
            refreshToken,
            accessTokenValidUntil: Date.now() + 15 * 60 * 1000,
            refreshTokenValidUntil: Date.now() + 30 * 24 * 60 * 60 * 1000
        });

        res.cookie('refreshToken', refreshToken, { httpOnly: true });
        res.status(200).json({
            status: 'success',
            message: 'Successfully logged in a user!',
            data: {
                accessToken
            }
        });
    } catch (error) {
        next(error);
    }
};

export const refresh = async (req, res, next) => {
    const { refreshToken } = req.cookies;

    try {
        if (!refreshToken) {
            throw createHttpError(401, 'No refresh token provided');
        }

        const session = await Session.findOne({ refreshToken });
        if (!session || session.refreshTokenValidUntil < Date.now()) {
            throw createHttpError(401, 'Refresh token expired');
        }

        await Session.findByIdAndDelete(session._id);

        const accessToken = jwt.sign({ userId: session.userId }, JWT_SECRET, { expiresIn: '15m' });
        const newRefreshToken = jwt.sign({ userId: session.userId }, JWT_SECRET, { expiresIn: '30d' });

        await Session.create({
            userId: session.userId,
            accessToken,
            refreshToken: newRefreshToken,
            accessTokenValidUntil: Date.now() + 15 * 60 * 1000,
            refreshTokenValidUntil: Date.now() + 30 * 24 * 60 * 60 * 1000
        });

        res.cookie('refreshToken', newRefreshToken, { httpOnly: true });
        res.status(200).json({
            status: 'success',
            message: 'Successfully refreshed a session!',
            data: {
                accessToken
            }
        });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res, next) => {
    const { refreshToken } = req.cookies;

    try {
        const session = await Session.findOneAndDelete({ refreshToken });
        if (!session) {
            throw createHttpError(404, 'Session not found');
        }

        res.clearCookie('refreshToken');
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};