import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';
import User from '../models/user.js';
import Session from '../models/session.js';
import { logoutUser, refreshUsersSession, requestResetToken, resetPassword } from '../services/auth.js';
import { randomBytes } from 'crypto';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_DAY = 30 * 24 * 60 * 60 * 1000;

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

        const accessToken = randomBytes(30).toString('base64'); 
        const refreshToken = randomBytes(30).toString('base64'); 

        await Session.findOneAndDelete({ userId: user._id });
        const session = await Session.create({
            userId: user._id,
            accessToken,
            refreshToken,
            accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES), 
            refreshTokenValidUntil: new Date(Date.now() + ONE_DAY) 
        });

        res.cookie('refreshToken', refreshToken, { httpOnly: true });
        res.cookie('sessionId', session._id, { httpOnly: true, expires: new Date(Date.now() + ONE_DAY) }); 
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

export const refreshUserSessionController = async (req, res, next) => {
    if (!req.cookies.sessionId) {
        throw createHttpError(400, 'Session ID is missing');
    }

    try {
        const session = await refreshUsersSession({
            sessionId: req.cookies.sessionId,
            refreshToken: req.cookies.refreshToken,
        });

        res.cookie('refreshToken', session.refreshToken, {
            httpOnly: true,
            expires: new Date(Date.now() + ONE_DAY),
        });
        res.cookie('sessionId', session._id, { 
            httpOnly: true,
            expires: new Date(Date.now() + ONE_DAY),
        });

        res.json({
            status: 200,
            message: 'Successfully refreshed a session!',
            data: {
                accessToken: session.accessToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const logoutUserController = async (req, res, next) => {
    if (!req.cookies.sessionId) {
        throw createHttpError(400, 'Session ID is missing');
    }

    try {
        await logoutUser(req.cookies.sessionId);
        res.clearCookie('sessionId');
        res.clearCookie('refreshToken');
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};


export const requestResetEmailController = async (req, res, next) => {
    try {
        await requestResetToken(req.body.email);
        res.json({
            status: 200,
            message: 'Reset password email has been successfully sent.',
            data: {},
        });
    } catch (error) {
        next(error);
    }
};

export const resetPasswordController = async (req, res, next) => {
    try {
        await resetPassword(req.body);
        res.json({
            status: 200,
            message: 'Password has been successfully reset.',
            data: {},
        });
    } catch (error) {
        next(error);
    }
};
