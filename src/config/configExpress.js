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
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser(secret));
    app.use(session());
};

module.exports = { configExpress };