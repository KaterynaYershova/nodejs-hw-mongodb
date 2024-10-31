import bcrypt from 'bcrypt';
import createHttpError from 'create-http-error';
import User from '../models/user.js';
import Session from '../models/session.js';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your_access_token_secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret';
const ACCESS_TOKEN_EXPIRATION = '15m';
const REFRESH_TOKEN_EXPIRATION = '30d';

export const register = async (req, res, next) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw createHttpError(409, 'Email in use');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword });

        res.status(201).json({
            status: 201,
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

        const accessToken = jwt.sign({ userId: user._id }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });
        const refreshToken = jwt.sign({ userId: user._id }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });

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
            status: 200,
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

        const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
        const session = await Session.findOne({ refreshToken });

        if (!session || session.refreshTokenValidUntil < Date.now()) {
            throw createHttpError(401, 'Invalid or expired refresh token');
        }

        await Session.findByIdAndDelete(session._id);

        const newAccessToken = jwt.sign({ userId: session.userId }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });
        const newRefreshToken = jwt.sign({ userId: session.userId }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });

        await Session.create({
            userId: session.userId,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            accessTokenValidUntil: Date.now() + 15 * 60 * 1000,
            refreshTokenValidUntil: Date.now() + 30 * 24 * 60 * 60 * 1000
        });

        res.cookie('refreshToken', newRefreshToken, { httpOnly: true });
        res.status(200).json({
            status: 200,
            message: 'Successfully refreshed a session!',
            data: {
                accessToken: newAccessToken
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
