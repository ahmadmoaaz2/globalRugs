const logger = require('./logger');
const MongoClient = require('mongodb').MongoClient;

let _db = null;

module.exports.getDb = function() {
    return _db;
};

module.exports.init = function() {
    const uri = "mongodb+srv://globalRugsAdmin:4i18nGDl07c3NZ5p@globalrugs-posem.mongodb.net/test?retryWrites=true&w=majority";
    const client = new MongoClient(uri, { useNewUrlParser: true });
    client.connect( function(err, client) {
        if (err)
            logger.logerror(err, "Connecting to Atlas Mongo BD");
        else
            _db = client.db('main');
    });
};

module.exports.eq = (param1, param2) => {
    return param1 === param2
};

module.exports.length = (list) => {
    return list.length
};

module.exports.multiply = (num1, num2) => {
    return (num1*num2).toFixed(2)
};

module.exports.round = (num) => {
    return Math.round(num)
};

module.exports.loggedIn = (req) => {
    if (req.cookies.admin === undefined)
        req.cookies.admin = false;
    if (req.cookies.cart === undefined)
        req.cookies.cart = [];
    return req.cookies.username !== undefined;
};
