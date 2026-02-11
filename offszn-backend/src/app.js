import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PORT } from './shared/config/config.js';
import { checkConnection } from './infrastructure/database/connection.js';

// Routes imports
import publicRoutes from './infrastructure/http/routes/public.routes.js';
import authRoutes from './infrastructure/http/routes/auth.routes.js';
import adminRoutes from './infrastructure/http/routes/admin.routes.js';
import orderRoutes from './infrastructure/http/routes/order.routes.js';
import cartRoutes from './infrastructure/http/routes/cart.routes.js';
import chatRoutes from './infrastructure/http/routes/chat.routes.js';
import socialRoutes from './infrastructure/http/routes/social.routes.js';
import paypalRoutes from './infrastructure/http/routes/paypal.routes.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.join(__dirname, '../../'); // Assumes offszn2 root

const allowedOrigins = [
    'https://offszn.com',
    'https://www.offszn.com',
    'https://offszn-oc7c.onrender.com',
    'https://offszn.onrender.com',
    'https://offszn1.onrender.com',
    'https://offszn-academy.onrender.com',
    'http://localhost:5173',
    'http://localhost:5500',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5500'
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Security Headers (COOP for Google Auth)
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    next();
});

// A. Security Block (Prevent access to backend source & secrets)
app.use((req, res, next) => {
    const sensitiveStart = ['/server', '/.env', '/.git', '/render.yaml', '/node_modules', '/backend'];
    if (sensitiveStart.some(s => req.path.startsWith(s))) {
        return res.status(403).send('Forbidden');
    }
    next();
});

// B. Clean URLs (Force Redirects & Internal Rewrites)
// Note: This matches legacy logic for .html removal and extensionless serving
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();

    // 1. Force Redirect: Remove .html from browser address bar
    if (req.path.endsWith('.html')) {
        const cleanPath = req.path.replace(/\.html$/, '');
        const search = req.originalUrl.split('?')[1];
        const queryString = search ? '?' + search : '';

        if (cleanPath.endsWith('/index')) {
            const rPath = cleanPath.slice(0, -6) || '/';
            return res.redirect(301, rPath + queryString);
        }
        return res.redirect(301, cleanPath + queryString);
    }

    // 2. Trailing Slash Removal
    if (req.path.length > 1 && req.path.endsWith('/')) {
        return res.redirect(301, req.path.slice(0, -1));
    }

    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// API Routes
app.use('/api', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/paypal', paypalRoutes);

checkConnection();

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
