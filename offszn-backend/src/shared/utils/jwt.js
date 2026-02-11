import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/config.js';

const expiresIn = '24h';

export const generateToken = (payload) => {
    if (!JWT_SECRET) {
        console.error("Error: JWT_SECRET is not defined in config.");
        throw new Error('Internal server error generating token.');
    }
    try {
        return jwt.sign(payload, JWT_SECRET, { expiresIn });
    } catch (error) {
        console.error("Error signing JWT:", error);
        throw new Error('Internal server error generating token.');
    }
};

export const verifyToken = (token) => {
    return new Promise((resolve, reject) => {
        if (!JWT_SECRET) {
            console.error("Error: JWT_SECRET is not defined.");
            return reject(new Error('Server configuration error.'));
        }
        if (!token) {
            return reject(new Error('No token provided.'));
        }

        jwt.verify(token, JWT_SECRET, (err, decodedPayload) => {
            if (err) {
                console.error("Error verifying token:", err.message);
                return reject(new Error('Invalid or expired token'));
            }
            resolve(decodedPayload);
        });
    });
};
