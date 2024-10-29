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

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            const message = err.name === 'TokenExpiredError' 
                ? 'Access token expired' 
                : 'Invalid access token';
            return next(createError(401, message));
        }

        req.user = { _id: decoded.userId };
        next();
    });
};
