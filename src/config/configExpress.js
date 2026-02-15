const cors = require('cors');
const cookieParser = require('cookie-parser');
const express = require('express');
const { session } = require('../middlewares/session');

const secret = process.env.COOKIE_SECRET || 'cookie secr3t'

function configExpress(app) {
    app.use((req, res, next) => {
    console.log(`🔥 ${req.method} ${req.url}`);
    next();
});
    app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // allow React Native

        const allowed = [
            'http://localhost:4200',
            'https://antondinkov.github.io'
        ];

        if (allowed.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(null, true); // allow mobile
        }
    },
    credentials: true
}));
    app.use(cookieParser(secret));
    app.use(session());
    //TODO add session middleware

    app.use('/static', express.static('static'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
};

module.exports = { configExpress };