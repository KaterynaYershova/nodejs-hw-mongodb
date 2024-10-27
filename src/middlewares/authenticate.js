import jwt from 'jsonwebtoken';
import createError from 'http-errors';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next(createError(401, 'Authorization header missing'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return next(createError(401, 'Access token missing'));
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return next(createError(401, 'Access token expired'));
        }

        req.user = user;
        next();
    });
};
