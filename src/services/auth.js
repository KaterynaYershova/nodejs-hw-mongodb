import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';
import User from '../models/user.js';
import Session from '../models/session.js';
import { sendEmail } from '../utils/sendMail.js';
import path from 'node:path';
import fs from 'node:fs/promises';
import handlebars from 'handlebars';
import { SMTP, TEMPLATES_DIR } from '../constants/index.js';
import { env } from '../utils/env.js';
import { validateCode, getFullNameFromGoogleTokenPayload } from '../utils/googleOAuth2.js';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_DAY = 30 * 24 * 60 * 60 * 1000;

export const registerUser = async ({ name, email, password }) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw createHttpError(409, 'Email in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword });
    return {
        status: 'success',
        message: 'Successfully registered a user!',
        data: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
        },
    };
};

export const loginUser = async ({ email, password }) => {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw createHttpError(401, 'Invalid email or password');
    }

    await Session.deleteMany({ userId: user._id });

    const accessToken = randomBytes(30).toString('base64');
    const refreshToken = randomBytes(30).toString('base64');

    const newSession = await Session.create({
        userId: user._id,
        accessToken,
        refreshToken,
        accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
        refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
    });

    return {
        status: 'success',
        message: 'Successfully logged in a user!',
        data: {
            accessToken,
            sessionId: newSession._id,
        },
        refreshToken,
    };
};

export const refreshUsersSession = async ({ sessionId, refreshToken }) => {
    const session = await Session.findOne({
        _id: sessionId,
        refreshToken,
    });

    if (!session) {
        throw createHttpError(401, 'Session not found');
    }

    const isSessionTokenExpired =
        new Date() > new Date(session.refreshTokenValidUntil);

    if (isSessionTokenExpired) {
        throw createHttpError(401, 'Session token expired');
    }

    const newAccessToken = randomBytes(30).toString('base64');
    const newRefreshToken = randomBytes(30).toString('base64');

    await Session.deleteOne({ _id: sessionId });

    return await Session.create({
        userId: session.userId,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
        refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
    });
};

export const logoutUser = async (sessionId) => {
    const session = await Session.findById(sessionId);
    if (!session) {
        throw createHttpError(404, 'Session not found');
    }

    await Session.deleteOne({ _id: sessionId });
    return { status: 'success', message: 'Successfully logged out' };
};

export const requestResetToken = async (email) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw createHttpError(404, 'User not found');
    }

    const resetToken = jwt.sign(
        { sub: user._id, email },
        env('JWT_SECRET'),
        { expiresIn: '15m' }
    );

    const templatePath = path.join(TEMPLATES_DIR, 'reset-password-email.html');
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);

    const html = template({
        name: user.name,
        link: `${env('APP_DOMAIN')}/reset-password?token=${resetToken}`,
    });

    await sendEmail({
        from: env(SMTP.SMTP_FROM),
        to: email,
        subject: 'Reset your password',
        html,
    });
};

export const resetPassword = async (payload) => {
    let decoded;
    try {
        decoded = jwt.verify(payload.token, env('JWT_SECRET'));
    } catch (err) {
        throw createHttpError(401, 'Token is expired or invalid');
    }

    const user = await User.findOne({ email: decoded.email, _id: decoded.sub });
    if (!user) {
        throw createHttpError(404, 'User not found');
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    await User.updateOne({ _id: user._id }, { password: hashedPassword });
};

export const loginOrSignupWithGoogle = async (code) => {
    const loginTicket = await validateCode(code);
    const payload = loginTicket.getPayload();
    if (!payload) throw createHttpError(401);

    let user = await User.findOne({ email: payload.email });
    if (!user) {
        const password = await bcrypt.hash(randomBytes(10).toString('hex'), 10);
        user = await User.create({
            email: payload.email,
            name: getFullNameFromGoogleTokenPayload(payload),
            password,
            role: 'parent',
        });
    }

    const accessToken = randomBytes(30).toString('base64');
    const refreshToken = randomBytes(30).toString('base64');

    const newSession = await Session.create({
        userId: user._id,
        accessToken,
        refreshToken,
        accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
        refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
    });

    return {
        status: 'success',
        message: 'Successfully logged in via Google OAuth!',
        data: {
            accessToken: newSession.accessToken,
            refreshToken: newSession.refreshToken,
        },
    };
};
