import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';
import User from '../models/user.js';
import Session from '../models/session.js';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES = '30d';

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

    const accessToken = jwt.sign({ userId: user._id }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
    const refreshToken = jwt.sign({ userId: user._id }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES });

    await Session.create({
        userId: user._id,
        accessToken,
        refreshToken,
        accessTokenValidUntil: new Date(Date.now() + 15 * 60 * 1000), 
        refreshTokenValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
    });

    return {
        status: 'success',
        message: 'Successfully logged in an user!',
        data: { accessToken },
        refreshToken, 
    };
};

const createSession = () => {
    const accessToken = randomBytes(30).toString('base64');
    const refreshToken = randomBytes(30).toString('base64');
  
    return {
      accessToken,
      refreshToken,
      accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
      refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
    };
  };
  
  export const refreshUsersSession = async ({ sessionId, refreshToken }) => {
    const session = await SessionsCollection.findOne({
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
    
    const newSession = createSession();
  
    await SessionsCollection.deleteOne({ _id: sessionId, refreshToken });
  
    return await SessionsCollection.create({
      userId: session.userId,
      ...newSession,
    });
  };

export const logoutUser = async (userId) => {
    await Session.deleteOne ({ userId });
    return { status: 'success', message: 'Successfully logged out' };
};
