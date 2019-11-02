const express = require('express');
const logger = require('./logger');
const session = require('express-session');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

let setup = (app) => {
    app.use(methodOverride('_method'));
    app.use(session({
        secret: '5N3BG2Z0XZQBOWNPGOXE',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: true, maxAge:7200000, httpOnly:true }
    }));
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.use(express.static(__dirname + '/public'));
    app.use((request, response, next) => {
        logger.logit(request.method, request.url, response.statusCode, request.cookies.username, request.headers['x-forwarded-for'] || request.connection.remoteAddress || "Anonymous");
        next();
    });

    app.set('view engine', 'hbs');
};

module.exports = {
    setup
};