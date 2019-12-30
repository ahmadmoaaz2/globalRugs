const express = require('express');
const hbs = require('hbs');
const utils = require('./utils');
const {ObjectId} = require("mongodb");
const users = require('./users');
const moment = require('moment');
const expressConfig = require('./expressConfig');
const logger = require('./logger');
const nodemailer = require('nodemailer');
const multer = require("multer");
const fs = require("fs");
const crypto = require("crypto");
const mime = require('mime');
const upload = multer({
    storage:
        multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, __dirname+"/public")
        },
        filename: function (req, file, cb) {
            crypto.pseudoRandomBytes(16, function (err, raw) {
                cb(null, raw.toString('hex') + Date.now() + '.' + mime.getExtension(file.mimetype));
            });
        }
    })});
const adminPassword = "DFEMj1eX565Ec34dNd364TDSgKga12EGE4II43245H34NBHYU&TYT&IUuikjfnhyuuiBHGYT&*IJBgtui7uokb4ht78fofkdnfjgy5k";
let app = express();
const port = process.env.PORT || 8080;

expressConfig.setup(app);

const eq = utils.eq;

const length = utils.length;

const multiply = utils.multiply;

const round = utils.round;

const JSONstring = (item) => {
    return JSON.stringify(item)
};

const compareReviews = (a, b) => {
    const dateA = Date.parse(a.updated_date_time);
    const dateB = Date.parse(b.updated_date_time);

    let comparison = 0;
    if (dateA > dateB) {
        comparison = -1;
    } else if (dateA < dateB) {
        comparison = 1;
    }
    return comparison;
};

hbs.registerHelper('multiply', multiply);

hbs.registerHelper('length', length);

hbs.registerHelper('eq', eq);

hbs.registerHelper('round', round);

hbs.registerHelper('JSONstring', JSONstring);

hbs.registerPartials(__dirname + '/views/partials');

let loggedIn = utils.loggedIn;

app.get('/', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    loggedIn(req);
    site.imageCount = (!Array.isArray(site.HomeImage)) ? 1 : 2;
    res.render('Homepage.hbs', {
        title: "Home",
        active: {Home: true},
        user: req.cookies.username, site: site,
        admin: JSON.parse(req.cookies.admin),
        currentMessage: req.cookies.currentMessage,
        cart: req.cookies.cart
    });
    res.clearCookie('currentMessage');
});

app.post('/upload', upload.single("picture"), (req, res) => {
    if (req.file) {
        res.cookie("currentMessage", "Successfully Uploaded");
        res.redirect("/images");
    } else {
        res.cookie("currentMessage", "Failed Upload");
        res.redirect("/images");
    }
});

app.get('/upload', async (req, res) => {
    let db = utils.getDb();
    fs.mkdirSync(__dirname+"/public", {recursive: true});
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req) && JSON.parse(req.cookies.admin)){
        res.render('upload.hbs', {
            title: "Images",
            active: {Images: true},
            user: req.cookies.username, site: site,
            admin: JSON.parse(req.cookies.admin),
            currentMessage: req.cookies.currentMessage,
            cart: req.cookies.cart
        });
        res.clearCookie("currentMessage");
    } else {
        res.cookie('currentMessage', "Please Login as admin to view images");
        res.redirect('/Loginpage');
    }
});

app.get("/images", async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req) && JSON.parse(req.cookies.admin)){
        fs.readdir(__dirname+"/public", ((err, files) => {
            if (err){
                logger.logerror(err, "Reading Images From Directory");
                res.cookie("currentMessage", "Failed to load image files")
            }
            res.render("Images.hbs", {
                files: files,
                active: {Images: true}, title: "Images",
                user: req.cookies.username, site: site,
                admin: JSON.parse(req.cookies.admin),
                currentMessage: req.cookies.currentMessage,
                cart: req.cookies.cart
            });
            res.clearCookie("currentMessage");
        }));
    } else {
        res.cookie('currentMessage', "Please Login as admin to view images");
        res.redirect('/Loginpage');
    }
});

app.get("/reviews", async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    loggedIn(req);
    db.collection("reviews").find().toArray((err, reviews) => {
        if (err)
            logger.logerror(err,"Load Reviews Page");
        let reviewByUser = false;
        let nonApproved = true;
        for (let review of reviews) {
            if (req.cookies.username === review.account)
                reviewByUser = true;
            if (review.approved === true)
                nonApproved = !review.approved;
        }
        res.render('Reviews.hbs', {
            title: "Reviews",
            reviews: reviews,
            noneApproved: nonApproved,
            reviewByUser: reviewByUser,
            active: {Reviews: true},
            user: req.cookies.username, site: site,
            admin: JSON.parse(req.cookies.admin),
            currentMessage: req.cookies.currentMessage,
            cart: req.cookies.cart
        });
        res.clearCookie('currentMessage');
    });
});

app.get("/reviews-add-form", async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if(loggedIn(req)) {
        res.render('review-add.hbs', {
            title: "Add Review",
            active: {Reviews: true},
            user: req.cookies.username, site: site,
            admin: JSON.parse(req.cookies.admin),
            currentMessage: req.cookies.currentMessage,
            cart: req.cookies.cart
        });
        res.clearCookie('currentMessage');
    } else {
        res.cookie("currentMessage", "Please Login to post a review");
        res.redirect("/Loginpage")
    }
});

app.post("/reviews", async (req, res) => {
    let db = utils.getDb();
    if (loggedIn(req)) {
        db.collection('reviews').insertOne({
            rating: req.body.rating,
            time: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
            review: req.body.review,
            approved: false,
            visible: true,
            account: req.cookies.username,
        }, (err, result) => {
            if (err) {
                logger.logerror(err, 'Make Review');
                res.cookie('currentMessage', 'Unable to make review');
                res.redirect('/reviews-add-form');
            } else {
                logger.logDB('Make Review', req.cookies.username);
                res.cookie('currentMessage', 'Created Successfully, Your Review will be checked by Admins Before it is Published');
                res.redirect('/reviews');
            }
        });
    } else {
        res.cookie('currentMessage', "Please Login to add reviews");
        res.redirect('/Loginpage');
    }
});

app.post("/reviewAdmin/:id", async (req, res) => {
    let db = utils.getDb();
    if (loggedIn(req) && JSON.parse(req.cookies.admin) === true){
        db.collection("reviews").updateOne({_id:ObjectId(req.params.id)}, {
            $set: {approved: true}
        }, (err, result) => {
            if (err){
                logger.logerror(err, "Approve Review");
                res.cookie("currentMessage", "Failed to approve Review");
                res.redirect("/reviews")
            } else {
                logger.logDB("Approve Review", req.cookies.username);
                res.cookie("currentMessage", "Successfully Approved Review");
                res.redirect("/reviews")
            }
        })
    } else {
        res.cookie('currentMessage', "Please Login as Admin to edit reviews");
        res.redirect('/Loginpage');
    }
});

app.put("/reviewAdmin/:id", async (req, res) => {
    let db = utils.getDb();
    if (loggedIn(req) && JSON.parse(req.cookies.admin) === true){
        db.collection("reviews").updateOne({_id:ObjectId(req.params.id)}, {
            $set: {visible: false}
        }, (err, result) => {
            if (err){
                logger.logerror(err, "Remove Review");
                res.cookie("currentMessage", "Failed to Remove Review");
                res.redirect("/reviews")
            } else {
                logger.logDB("Remove Review", req.cookies.username);
                res.cookie("currentMessage", "Successfully Removed Review");
                res.redirect("/reviews")
            }
        })
    } else {
        res.cookie('currentMessage', "Please Login as Admin to edit reviews");
        res.redirect('/Loginpage');
    }
});

app.delete("/review/:id", async (req, res) => {
    let db = utils.getDb();
    if (loggedIn(req)){
        db.collection("reviews").findOneAndDelete({_id:ObjectId(req.params.id)}, (err, result) => {
            if (err){
                logger.logerror(err, "Delete User Review");
                res.cookie("currentMessage", "Failed to delete Review");
                res.redirect('/reviews')
            } else {
                logger.logDB("Delte Review", req.cookies.username);
                res.cookie("currentMessage", "Succesfully Deleted");
                res.redirect("/reviews")
            }
        })
    } else {
        res.cookie("currentMessage", "You cannot delete others reviews");
        res.redirect("/reviews")
    }
});

app.get('/Loginpage', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        res.cookie('currentMessage', "Already Logged In");
        res.redirect("/")
    } else {
        res.render('Loginpage.hbs', {
            user: req.cookies.username, site: site,
            admin: JSON.parse(req.cookies.admin),
            currentMessage: req.cookies.currentMessage,
            cart: req.cookies.cart,
            title: "Login", active: {Login: true}
        });
        res.clearCookie('currentMessage');
    }
});

app.get('/Makeaccountpage', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        res.cookie('currentMessage', "Already Logged In");
        res.redirect("/")
    }
    res.render('Makeaccountpage.hbs', {
        title: "Login",
        active: {Login: true},
        site: site,
        admin: JSON.parse(req.cookies.admin),
        currentMessage: req.cookies.currentMessage,
        cart: req.cookies.cart
    });
    res.clearCookie('currentMessage');
});

app.get('/Adminmakeaccountpage', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        res.cookie('currentMessage', "Already Logged In");
        res.redirect("/");
        return;
    }
    if (!JSON.parse(req.cookies.admin)) {
        res.cookie('currentMessage', "No Access to this page");
        res.redirect('/Makeaccountpage');
        return;
    }
    res.render('Makeadminaccountpage.hbs', {
        title: "Login",
        active: {Login: true},
        site: site,
        admin: JSON.parse(req.cookies.admin),
        currentMessage: req.cookies.currentMessage,
        cart: req.cookies.cart
    });
    res.clearCookie('currentMessage');
});

app.get('/admincheck', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    loggedIn(req);
    if (JSON.parse(req.cookies.admin) === true) {
        res.cookie('currentMessage', "Already an admin");
        res.redirect('/Adminmakeaccountpage')
    } else
        res.render('admincheck.hbs', {
            title: "Login",
            site: site,
            active: {Login: true},
            admin: JSON.parse(req.cookies.admin),
            currentMessage: req.cookies.currentMessage,
            cart: req.cookies.cart
        });
    res.clearCookie('currentMessage');
});

app.get('/Contact', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    loggedIn(req);
    db.collection('logs').find({logtype: "userMessages"}).toArray((err, result) => {
        if (err)
            logger.logerror(err, "Loading user messages");
        else {
            result = result[0];
            if (req.query.filter) {
                var newResult = [];
                for (let i in result.logs) {
                    let testString = `${result.logs[i].time} ${result.logs[i].name} ${result.logs[i].subject} ${result.logs[i].email} ${result.logs[i].message} ${result.logs[i].accountName}`.toLowerCase();
                    if (testString.includes(req.query.filter.toLowerCase())) {
                        newResult.push(result.logs[i])
                    }
                }
            } else {
                var newResult = result.logs
            }
            res.render('Contact.hbs', {
                messages: newResult,
                user: req.cookies.username, site: site,
                admin: JSON.parse(req.cookies.admin),
                currentMessage: req.cookies.currentMessage,
                cart: req.cookies.cart,
                title: "Contact", active: {Contact: true}
            });
            res.clearCookie('currentMessage');
        }
    });
});

app.get('/ShoppingCart', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        let total = 0;
        for (let i in req.cookies.cart) {
            total += req.cookies.cart[i].salePrice * req.cookies.cart[i].quantity;
        }
        total = total.toFixed(2);
        res.render('ShoppingCart.hbs', {
            title: "User",
            active: {User: true},
            total: total,
            user: req.cookies.username, site: site,
            admin: JSON.parse(req.cookies.admin),
            currentMessage: req.cookies.currentMessage,
            cart: req.cookies.cart
        });
        res.clearCookie('currentMessage');
    } else {
        res.cookie('currentMessage', "Must be Logged in to view cart");
        res.redirect('/Loginpage');
    }
});

app.post('/deleteCart/:id', async (req, res) => {
    let db = utils.getDb();
    let id = Number(req.params.id);
    for (let i in req.cookies.cart) {
        if (id === Number(req.cookies.cart[i].cartid)) {
            console.log(req.cookies.cart[i]);
            req.cookies.cart.splice(i, 1);
            res.cookie('currentMessage', "Deleted Successfully");
            res.cookie('cart', req.cookies.cart);
            res.redirect('/ShoppingCart');
            return;
        }
    }
    res.cookie('currentMessage', "Failed");
    res.redirect('/ShoppingCart')
});

app.post('/addCart/:id', async (req, res) => {
    let db = utils.getDb();
    let product_id = req.params.id;
    let quantity = req.body.quantity;
    let cartid = 0;
    if (req.cookies.cart)
        for (let i in req.cookies.cart)
            if (Number(req.cookies.cart[i].cartid) > cartid)
                cartid = Number(req.cookies.cart[i].cartid);
    db.collection('products').findOne({_id: ObjectId(product_id)}, (err, result) => {
        if (err) {
            logger.logerror(err, "Add product to cart");
            logger.logDB('Get Product by ID', "sales", "Failed");
            res.send('Unable to retrieve sales data');
        } else if (result === null) {
            logger.logDB('Get Sales by ID', "products", "Failed");
            res.cookie('currentMessage', "No sale found with the given id");
            res.redirect('/products');
        } else {
            if (req.cookies.cart) {
                req.cookies.cart.push({
                    id: product_id,
                    quantity: quantity,
                    suggestedPrice: result.suggestedPrice,
                    salePrice: result.salePrice,
                    name: result.name,
                    cartid: cartid + 1,
                    image: result.image,
                    desc: result.description
                });
                res.cookie('cart', req.cookies.cart);
            } else
                res.cookie('cart', [{
                    id: product_id,
                    quantity: quantity,
                    suggestedPrice: result.suggestedPrice,
                    salePrice: result.salePrice,
                    name: result.name,
                    cartid: cartid + 1,
                    image: result.image,
                    desc: result.description
                }]);
            res.redirect('/products')
        }

    });
});

app.post('/Checkout', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        if (req.cookies.cart.length === 0) {
            res.cookie("currentMessage", "No items in cart");
            res.redirect('/products');
            return;
        }
        try {
            for (let i in req.cookies.cart) {
                let cartid = Number(req.cookies.cart[i].cartid);
                let item = req.cookies.cart[i].name;
                let quantity = req.cookies.cart[i].quantity;
                let unit_price = req.cookies.cart[i].salePrice;
                let created_date_time = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
                let db = utils.getDb();
                db.collection('sales').insertOne({
                    item: item,
                    quantity: quantity,
                    unit_price: unit_price,
                    user: req.cookies.username, site: site,
                    created_date_time: created_date_time,
                    update_date_time: created_date_time,
                }, (err, result) => {
                    if (err) {
                        logger.logerror(err, "Make Sale from Cart");
                        logger.logDB('Make Sale From Cart', req.cookies.username, "Failed");
                        res.cookie('currentMessage', 'Unable to store sales data');
                    } else {
                        logger.logDB('Make Sale from Cart', req.cookies.username);
                    }
                });
            }
        } finally {
            res.cookie('currentMessage', 'Created Successfully');
            res.cookie('cart', []);
            res.redirect('/sales');
        }
    } else {
        res.cookie('currentMessage', "Please Login to view sales");
        res.redirect('/Loginpage');
    }
});

app.get('/Logout', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    logger.loguser("Logout", "Success", req.cookies.username);
    res.clearCookie('username');
    res.clearCookie("disabledCount");
    res.cookie('admin', false);
    res.clearCookie('currentMessage');
    res.clearCookie('cart');
    res.redirect('/');
});

// Disabled
// app.post('/register', async (req, res) => {
//     let db = utils.getDb();
//     let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
//     let username = req.body.name;
//     let password = req.body.password;
//     let email = req.body.email;
//     users.addUser(String(username), String(password), String(email), (message) => {
//         if (message === "Created Successfully") {
//             res.cookie('username', username);
//             res.redirect('/')
//         } else {
//             res.cookie('currentMessage', message);
//             res.redirect('/Makeaccountpage')
//         }
//     });
// });

app.post('/registerAdmin', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (!JSON.parse(req.cookies.admin)) {
        res.cookie('currentMessage', "No Access to this page");
        res.redirect('/Adminmakeaccountpage');
        return;
    }
    let username = req.body.name;
    let password = req.body.password;
    let email = req.body.email;
    users.addAdmin(String(username), String(password), String(email), (message) => {
        if (message === "Created Successfully") {
            res.cookie('username', username);
            res.redirect('/')
        } else {
            res.cookie('currentMessage', message);
            res.redirect('/Adminmakeaccountpage')
        }
    });
});

app.post('/VerifyAdminPass', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    let password = req.body.password;
    if (password === adminPassword) {
        res.cookie('admin', true);
        res.cookie('currentMessage', "Admin Verification Success!");
        res.redirect('/Adminmakeaccountpage')
    } else {
        res.cookie('currentMessage', "Sorry, wrong password");
        res.redirect('/admincheck')
    }
});

app.post('/login', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (Number(req.cookies.disabledCount) >= 5) {
        res.cookie("currentMessage", "Your IP has been disabled for 1 minute");
        res.cookie("disabledCount", 5, {maxAge: 60000});
        res.redirect('/Loginpage');
        logger.loguser("Sign In", "Failed Too Many Attempts", req.headers['x-forwarded-for'] || req.connection.remoteAddress || "Anonymous");
        return;
    }
    let username = req.body.name;
    let password = req.body.password;
    users.authenticate(String(username), String(password), (message, admin) => {
        if (message === "Logged In") {
            res.cookie('username', username);
            res.cookie('admin', admin);
            res.clearCookie("disabledCount");
            res.redirect('/');

        } else {
            if (req.cookies.disabledCount === undefined)
                req.cookies.disabledCount = 0;
            res.cookie('disabledCount', Number(req.cookies.disabledCount) + 1);
            res.cookie('currentMessage', message);
            res.redirect('/Loginpage');

        }
    });
});

app.get('/logs', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        users.checkAdmin(req.cookies.username, (result) => {
            if (!result) {
                res.cookie('currentMessage', 'Must be admin to view logs');
                res.redirect('/');
                return;
            }
            let db = utils.getDb();
            let serverVisits = undefined;
            db.collection("logs").find().toArray((err, array) => {
                if (err)
                    logger.logerror(err, "Display Logs");
                else if (!result) {
                    logger.logDB("Get Logs", req.cookies.username, "Failed (Nothing Found)")
                } else {
                    for (let i in array) {
                        if (array[i].logtype === "serverVisit") {
                            serverVisits = array[i].logs
                        }
                    }
                    if (req.query.filter) {
                        var newServerVisits = [];
                        for (let J in serverVisits) {
                            let testString = `${serverVisits[J].time} ${serverVisits[J].method} ${serverVisits[J].url} ${serverVisits[J].status} ${serverVisits[J].user} ${serverVisits[J].ip}`.toLowerCase();
                            if (testString.includes(req.query.filter.toLowerCase())) {
                                newServerVisits.push(serverVisits[J])
                            }
                        }
                    } else {
                        var newServerVisits = serverVisits;
                    }
                    res.render('log.hbs', {
                        serverVisits: newServerVisits,
                        user: req.cookies.username, site: site,
                        admin: JSON.parse(req.cookies.admin),
                        currentMessage: req.cookies.currentMessage,
                        cart: req.cookies.cart,
                        title: "Logs", active: {Logs: true}
                    });
                    res.clearCookie('currentMessage');
                }
            });
        })
    } else {
        res.cookie('currentMessage', "Must be Logged in to view logs");
        res.redirect('/Loginpage');
    }
});

app.get("/logsError", async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        users.checkAdmin(req.cookies.username, (result) => {
            if (!result) {
                res.cookie('currentMessage', 'Must be admin to view logs');
                res.redirect('/');
                return;
            }
            let db = utils.getDb();
            let serverErrors = undefined;
            db.collection("logs").find().toArray((err, array) => {
                if (err)
                    logger.logerror(err, "Display Logs");
                else if (!result) {
                    logger.logDB("Get Logs", req.cookies.username, "Failed (Nothing Found)")
                } else {
                    for (let i in array) {
                        if (array[i].logtype === "serverErrors") {
                            serverErrors = array[i].logs
                        }
                    }
                    if (req.query.filter) {
                        var newServerErrors = [];
                        for (let J in serverErrors) {
                            let testString = `${serverErrors[J].time} ${serverErrors[J].action} ${serverErrors[J].error}`.toLowerCase();
                            if (testString.includes(req.query.filter.toLowerCase())) {
                                newServerErrors.push(serverErrors[J])
                            }
                        }
                    } else {
                        var newServerErrors = serverErrors;
                    }
                    res.render('logErrors.hbs', {
                        serverErrors: newServerErrors,
                        user: req.cookies.username, site: site,
                        admin: JSON.parse(req.cookies.admin),
                        currentMessage: req.cookies.currentMessage,
                        cart: req.cookies.cart,
                        title: "Logs", active: {Logs: true}
                    });
                    res.clearCookie('currentMessage');
                }
            });
        })
    } else {
        res.cookie('currentMessage', "Must be Logged in to view logs");
        res.redirect('/Loginpage');
    }
});

app.get("/logsLogin", async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        users.checkAdmin(req.cookies.username, (result) => {
            if (!result) {
                res.cookie('currentMessage', 'Must be admin to view logs');
                res.redirect('/');
                return;
            }
            let db = utils.getDb();
            let userLogins = undefined;
            db.collection("logs").find().toArray((err, array) => {
                if (err)
                    logger.logerror(err, "Display Logs");
                else if (!result) {
                    logger.logDB("Get Logs", req.cookies.username, "Failed (Nothing Found)")
                } else {
                    for (let i in array) {
                        if (array[i].logtype === "userLogins") {
                            userLogins = array[i].logs
                        }
                    }
                    if (req.query.filter) {
                        var newUserLogins = [];
                        for (let J in userLogins) {
                            let testString = `${userLogins[J].time} ${userLogins[J].action} ${userLogins[J].status} ${userLogins[J].user}`.toLowerCase();
                            if (testString.includes(req.query.filter.toLowerCase())) {
                                newUserLogins.push(userLogins[J])
                            }
                        }
                    } else {
                        var newUserLogins = userLogins;
                    }
                    res.render('logLogin.hbs', {
                        userLogins: newUserLogins,
                        user: req.cookies.username, site: site,
                        admin: JSON.parse(req.cookies.admin),
                        currentMessage: req.cookies.currentMessage,
                        cart: req.cookies.cart,
                        title: "Logs", active: {Logs: true}
                    });
                    res.clearCookie('currentMessage');
                }
            });
        })
    } else {
        res.cookie('currentMessage', "Must be Logged in to view logs");
        res.redirect('/Loginpage');
    }
});

app.get("/logsDB", async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        users.checkAdmin(req.cookies.username, (result) => {
            if (!result) {
                res.cookie('currentMessage', 'Must be admin to view logs');
                res.redirect('/');
                return;
            }
            let db = utils.getDb();
            let dbUsage = undefined;
            db.collection("logs").find().toArray((err, array) => {
                if (err)
                    logger.logerror(err, "Display Logs");
                else if (!result) {
                    logger.logDB("Get Logs", req.cookies.username, "Failed (Nothing Found)")
                } else {
                    for (let i in array) {
                        if (array[i].logtype === "dbUsage") {
                            dbUsage = array[i].logs
                        }
                    }
                    if (req.query.filter) {
                        var newDbUsage = [];
                        for (let J in dbUsage) {
                            let testString = `${dbUsage[J].time} ${dbUsage[J].action} ${dbUsage[J].status} ${dbUsage[J].user}`.toLowerCase();
                            if (testString.includes(req.query.filter.toLowerCase())) {
                                newDbUsage.push(dbUsage[J])
                            }
                        }
                    } else {
                        var newDbUsage = dbUsage;
                    }
                    res.render('logDB.hbs', {
                        dbUsage: newDbUsage,
                        user: req.cookies.username, site: site,
                        admin: JSON.parse(req.cookies.admin),
                        currentMessage: req.cookies.currentMessage,
                        cart: req.cookies.cart,
                        title: "Logs", active: {Logs: true}
                    });
                    res.clearCookie('currentMessage');
                }
            });
        })
    } else {
        res.cookie('currentMessage', "Must be Logged in to view logs");
        res.redirect('/Loginpage');
    }
});

// Disabled
// app.get('/sales', async (req, res) => {
//     let db = utils.getDb();
//     let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
//     if (loggedIn(req)) {
//         let db = utils.getDb();
//         db.collection('sales').find({}).toArray((err, result) => {
//             if (err) {
//                 logger.logerror(err, 'Get Sales');
//                 res.cookie('currentMessage', 'Unable to retrieve sales data');
//                 res.redirect('/sales');
//                 return;
//             }
//             if (req.query.filter) {
//                 let newResult = [];
//                 for (let J in result) {
//                     let testString = `${result[J].created_date_time} ${result[J].update_date_time} ${result[J].item} ${result[J].user} ${result[J].quantity} ${result[J].unit_price}`.toLowerCase();
//                     if (testString.includes(req.query.filter.toLowerCase())) {
//                         newResult.push(result[J])
//                     }
//                 }
//                 result = newResult;
//             }
//             result.reverse();
//             if (JSON.parse(req.cookies.admin))
//                 res.render('sales.hbs', {
//                     title: "Sales",
//                     active: {Sales: true},
//                     sales: result,
//                     user: req.cookies.username, site: site,
//                     admin: JSON.parse(req.cookies.admin),
//                     currentMessage: req.cookies.currentMessage,
//                     cart: req.cookies.cart
//                 });
//             else {
//                 let filtered = [];
//                 for (let i in result) {
//                     if (result[i].user === req.cookies.username)
//                         filtered.push(result[i])
//                 }
//                 res.render('sales.hbs', {
//                     sales: filtered,
//                     user: req.cookies.username, site: site,
//                     admin: JSON.parse(req.cookies.admin),
//                     currentMessage: req.cookies.currentMessage,
//                     cart: req.cookies.cart,
//                     title: "Sales", active: {Sales: true}
//                 });
//             }
//             res.clearCookie('currentMessage');
//         });
//     } else {
//         res.cookie('currentMessage', "Please Login to view sales");
//         res.redirect('/Loginpage');
//     }
// });

app.get('/sales-add-form', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        let db = utils.getDb();
        db.collection('products').find({}).toArray((err, result) => {
            if (err) {
                logger.logerror(err, "Get Sales");
                res.cookie('currentMessage', 'Unable to retrieve products data');
                res.redirect('/sales')
            }
            res.render('sales-add-form.hbs', {
                title: "Sales",
                active: {Sales: true},
                products: result,
                user: req.cookies.username, site: site,
                admin: JSON.parse(req.cookies.admin),
                currentMessage: req.cookies.currentMessage,
                cart: req.cookies.cart
            });
            res.clearCookie('currentMessage');
        });
    } else {
        res.cookie('currentMessage', "Please Login to view sales");
        res.redirect('/Loginpage');
    }
});

app.get('/sales-edit-form/:id', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        let db = utils.getDb();
        db.collection("sales").findOne({_id: ObjectId(req.params.id)}, function (err, result) {
            if (err) {
                logger.logerror(err, 'Get Sales by ID');
                res.send('Unable to retrieve sales data');
            } else if (result === null) {
                logger.logDB('Get Sales by ID', "products", "Failed");
                res.cookie('currentMessage', "No sale found with the given id");
                res.redirect('/sales');
            } else
                db.collection('products').find({}).toArray((err, productsResult) => {
                    if (err) {
                        logger.logerror(err, "Retrieving Products Data");
                        res.cookie('currentMessage', 'Unable to retrieve products data');
                        res.redirect('/sales')
                    }
                    res.render('sales-edit-form.hbs', {
                        title: "Sales",
                        active: {Sales: true},
                        products: productsResult,
                        sale: result,
                        user: req.cookies.username, site: site,
                        admin: JSON.parse(req.cookies.admin),
                        currentMessage: req.cookies.currentMessage,
                        cart: req.cookies.cart
                    });
                    res.clearCookie('currentMessage');
                });
        });
    } else {
        res.cookie('currentMessage', "Please Login to view sales");
        res.redirect('/Loginpage');
    }
});

app.post('/sales', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        let item = req.body.item;
        let quantity = req.body.quantity;
        let unit_price = req.body.unit_price;
        let created_date_time = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
        let db = utils.getDb();
        db.collection('sales').insertOne({
            item: item,
            quantity: quantity,
            unit_price: unit_price,
            user: req.cookies.username, site: site,
            created_date_time: created_date_time,
            update_date_time: created_date_time,
        }, (err, result) => {
            if (err) {
                logger.logerror(err, 'Make Sales');
                res.cookie('currentMessage', 'Unable to store sales data');
                res.redirect('/sales-add-form');
            } else {
                logger.logDB('Make Sales, item:' + result.item, req.cookies.username);
                res.cookie('currentMessage', 'Created Successfully');
                res.redirect('/sales');
            }
        });
    } else {
        res.cookie('currentMessage', "Please Login to view sales");
        res.redirect('/Loginpage');
    }
});

app.put('/sales/:id', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    loggedIn(req);
    let item = req.body.item;
    let price = req.body.price;
    let quantity = req.body.quantity;
    let unit_price = req.body.unit_price;
    let update_date_time = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    db.collection("sales").updateOne({_id: ObjectId(req.params.id)}, {
        $set: {
            item: item,
            quantity: quantity,
            unit_price: unit_price,
            update_date_time: update_date_time,
        }
    }, function (err, result) {
        if (err) {
            logger.logerror(err, 'Update Sales');
            res.cookie('currentMessage', 'Unable to update sales data');
            res.redirect('/sales-edit-form/' + req.params.id)
        } else if (result === null) {
            logger.logDB('Update Sales', req.cookies.username, "Failed");
            res.cookie('currentMessage', 'There is no sale with the given id');
            res.redirect('/sales')
        } else {
            logger.logDB('Update Sales, item: ' + item, req.cookies.username);
            res.cookie('currentMessage', 'Updated Successfully');
            res.redirect('/sales')
        }
    });
});

app.delete('/sales/:id', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    loggedIn(req);
    db.collection("sales").findOneAndDelete({_id: ObjectId(req.params.id)}, function (err, result) {
        if (err) {
            logger.logerror(err, 'Delete Sales');
            res.cookie('currentMessage', 'Unable to delete sales data');
            res.redirect('/sales');
        } else if (result === null) {
            logger.logDB('Delete Sales', req.cookies.username, "Failed");
            res.cookie('currentMessage', 'There is no sale with the given id');
            res.redirect('/sales');
        } else {
            logger.logDB('Delete Sales, item id: ' + req.params.id, req.cookies.username);
            res.cookie('currentMessage', 'Deleted Successfully');
            res.redirect('/sales');
        }
    });
});

app.get('/sales/:id', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    loggedIn(req);
    db.collection("sales").findOne({_id: ObjectId(req.params.id)}, function (err, result) {
        if (err) {
            logger.logerror(err, 'Get Sales by ID');
            res.cookie('currentMessage', 'Unable to retrieve sales data');
            res.redirect('/')
        }
        logger.logDB('Get Sales by ID', req.cookies.username);
        res.send(JSON.stringify(result, undefined, 2));
    });
});

app.post('/contacts', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    loggedIn(req);
    let name = req.body.name;
    let email = req.body.email;
    let subject = req.body.subject;
    let message = req.body.message;
    logger.logMessage(name, email, subject, message, req.cookies.username);
    res.cookie('currentMessage', "Message Sent");
    res.redirect('/Contact')
});

app.post('/products', async (req, res) => {
    let db = utils.getDb();
    if (loggedIn(req)) {
        db.collection('products').insertOne({
            name: req.body.name,
            created_date_time: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
            update_date_time: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
            suggestedPrice: req.body.suggestedPrice,
            salePrice: req.body.salePrice,
            image: req.body.image,
            description: req.body.description,
        }, (err, result) => {
            if (err) {
                logger.logerror(err, 'Make Product');
                res.cookie('currentMessage', 'Unable to store products data');
                res.redirect('/products-add-form');
            } else {
                logger.logDB('Make Product, item: ' + req.body.name, req.cookies.username);
                res.cookie('currentMessage', 'Created Successfully');
                res.redirect('/products');
            }
        });
    } else {
        res.cookie('currentMessage', "Please Login to view products");
        res.redirect('/Loginpage');
    }
});

app.put('/products/:id', async (req, res) => {
    let db = utils.getDb();
    loggedIn(req);
    db.collection("products").updateOne({_id: ObjectId(req.params.id)}, {
        $set: {
            name: req.body.name,
            suggestedPrice: req.body.suggestedPrice,
            salePrice: req.body.salePrice,
            update_date_time: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
            image: req.body.image,
            description: req.body.description,
        }
    }, function (err, result) {
        if (err) {
            logger.logerror(err, 'Update Product');
            res.cookie('currentMessage', 'Unable to update products data');
            res.redirect('/products-edit-form/' + req.params.id)
        } else if (result === null) {
            logger.logDB('Update Product', req.cookies.username, "Failed");
            res.cookie('currentMessage', 'There is no product with the given id');
            res.redirect('/products')
        } else {
            logger.logDB('Update Product', req.cookies.username);
            res.cookie('currentMessage', 'Updated Successfully');
            res.redirect('/products')
        }
    });
});

app.delete('/products/:id', async (req, res) => {
    let db = utils.getDb();
    loggedIn(req);
    db.collection("products").findOneAndDelete({_id: ObjectId(req.params.id)}, function (err, result) {
        if (err) {
            logger.logerror(err, 'Delete Product');
            res.cookie('currentMessage', 'Unable to delete products data');
            res.redirect('/products');
        } else if (result === null) {
            logger.logDB('Delete Product', req.cookies.username, "Failed");
            res.cookie('currentMessage', 'There is no product with the given id');
            res.redirect('/products');
        } else {
            logger.logDB('Delete Product', req.cookies.username);
            res.cookie('currentMessage', 'Deleted Successfully');
            res.redirect('/products');
        }
    });
});

app.get('/products', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    loggedIn(req);
    db.collection('products').find({}).toArray((err, result) => {
        if (err) {
            logger.logerror(err, 'Get Product');
            res.cookie('currentMessage', 'Unable to retrieve products data');
            res.redirect('/products')
        }
        let newProducts = [];
        if (result) {
            if (req.query.filter) {
                for (let J in result) {
                    let testString = `${result[J].name} ${result[J].description}`.toLowerCase();
                    if (testString.includes(req.query.filter.toLowerCase())) {
                        newProducts.push(result[J])
                    }
                }
            } else {
                newProducts = result;
            }
            for (let product in newProducts)
                if (newProducts[product].reviews) {
                    newProducts[product].reviews.sort(compareReviews);
                    while (newProducts[product].reviews.length > 10)
                        newProducts[product].reviews.shift()
                }
        }
        res.render('products.hbs', {
            title: "Products",
            active: {Products: true},
            products: newProducts,
            user: req.cookies.username, site: site,
            admin: JSON.parse(req.cookies.admin),
            currentMessage: req.cookies.currentMessage,
            cart: req.cookies.cart
        });
        res.clearCookie('currentMessage');
    });
});

app.get('/products-add-form', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        res.render('products-add-form.hbs', {
            title: "Products",
            active: {Products: true},
            user: req.cookies.username, site: site,
            admin: JSON.parse(req.cookies.admin),
            currentMessage: req.cookies.currentMessage,
            cart: req.cookies.cart
        });
        res.clearCookie('currentMessage');
    } else {
        res.cookie('currentMessage', "Please Login to view products");
        res.redirect('/Loginpage');
    }
});

app.get('/products-edit-form/:id', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        let db = utils.getDb();
        db.collection("products").findOne({_id: ObjectId(req.params.id)}, function (err, result) {
            if (err) {
                logger.logerror(err, 'Get Product by ID');
                res.send('Unable to retrieve products data');
            } else if (result === null) {
                logger.logDB('Get Product by ID', req.cookies.username, "Failed");
                res.cookie('currentMessage', "No sale found with the given id");
                res.redirect('/products');
            } else {
                res.render('products-edit-form.hbs', {
                    title: "Products",
                    active: {Products: true},
                    product: result,
                    user: req.cookies.username, site: site,
                    admin: JSON.parse(req.cookies.admin),
                    currentMessage: req.cookies.currentMessage,
                    cart: req.cookies.cart
                });
                res.clearCookie('currentMessage');
            }
        });
    } else {
        res.cookie('currentMessage', "Please Login to view products");
        res.redirect('/Loginpage');
    }
});

app.get('/users', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        users.checkAdmin(req.cookies.username, (result) => {
            if (!result) {
                res.cookie('currentMessage', 'Must be admin to view users');
                res.redirect('/');
                return;
            }
            let db = utils.getDb();
            db.collection("users").find().toArray((err, array) => {
                if (err)
                    logger.logerror(err, "Display Users");
                else if (!array) {
                    logger.logDB("Get Users", req.cookies.username, "Failed (Nothing Found)")
                } else {
                    if (req.query.filter) {
                        var newAccounts = [];
                        for (let J in array) {
                            if (array[J].admin) {
                                array[J].admin = "Admin"
                            } else {
                                array[J].admin = "User"
                            }
                            array[J].password = users.decrypt(array[J].password);
                            let testString = `${array[J].name} ${array[J].admin} ${array[J].email}`.toLowerCase();
                            if (testString.includes(req.query.filter.toLowerCase())) {
                                newAccounts.push(array[J])
                            }
                        }
                    } else {
                        for (let J in array) {
                            if (array[J].admin) {
                                array[J].admin = "Admin"
                            } else {
                                array[J].admin = "User"
                            }
                            array[J].password = users.decrypt(array[J].password);
                        }
                        var newAccounts = array;
                    }
                    res.render('users.hbs', {
                        accounts: newAccounts,
                        user: req.cookies.username, site: site,
                        admin: JSON.parse(req.cookies.admin),
                        currentMessage: req.cookies.currentMessage,
                        cart: req.cookies.cart,
                        title: "Users", active: {users: true}
                    });
                    res.clearCookie('currentMessage');
                }
            });
        })
    } else {
        res.cookie('currentMessage', "Must be Logged in to view users");
        res.redirect('/Loginpage');
    }
});

app.post('/deleteUser/:id', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        users.checkAdmin(req.cookies.username, (result) => {
            if (!result) {
                res.cookie('currentMessage', 'Must be admin to view users');
                res.redirect('/');
                return;
            }
            let db = utils.getDb();
            db.collection("users").findOneAndDelete({_id: ObjectId(req.params.id)}, (err, result) => {
                if (err) {
                    logger.logerror(err, "Delete User");
                    res.cookie("currentMessage", "Unable to delete user");
                    res.redirect("/users");

                } else {
                    logger.logDB("Delete User", req.cookies.username);
                    res.cookie("currentMessage", "Deleted Successfully");
                    res.redirect('/users');

                }
            })
        })
    } else {
        res.cookie('currentMessage', "Must be Logged in to delete users");
        res.redirect('/Loginpage');
    }
});

app.post('/editUser/:id', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        users.checkAdmin(req.cookies.username, (result) => {
            if (!result) {
                res.cookie('currentMessage', 'Must be admin to view users');
                res.redirect('/');
                return;
            }
            let db = utils.getDb();
            db.collection('users').findOne({_id: ObjectId(req.params.id)}, (err, result) => {
                if (err) {
                    logger.logerror(err, "Finding User in /editUser");
                    res.cookie("currentMessage", "error occurred");
                    res.redirect('/users');
                    return;
                } else if (result === null) {
                    logger.logDB("Get User for /editUser", req.cookies.username, "Failed (not found)")
                } else {
                    if (req.body.username !== result.name) {
                        if (result.name === req.cookies.username)
                            res.cookie("username", req.body.username);
                        db.collection('sales').find().toArray((err, array) => {
                            if (err)
                                logger.logerror(err, "Update User");
                            else {
                                for (let i in array)
                                    if (array[i].user === result.name)
                                        db.collection("sales").updateOne({_id: ObjectId(array[i]._id)}, {
                                            $set: {
                                                user: req.body.username,
                                            }
                                        });
                                db.collection("products").find().toArray((err, array) => {
                                    if (err)
                                        logger.logerror(err, "Update User");
                                    else {
                                        for (let i in array)
                                            if (array[i].reviews)
                                                for (let j in array[i].reviews)
                                                    if (array[i].reviews[j].user === result.name) {
                                                        array[i].reviews[j].user = req.body.username;
                                                        db.collection('products').updateOne({_id: ObjectId(array[i]._id)}, {
                                                            $set: {
                                                                reviews: array[i].reviews
                                                            }
                                                        })
                                                    }

                                    }
                                });
                            }
                        });
                    }
                    db.collection("users").updateOne({_id: ObjectId(req.params.id)}, {
                        $set: {
                            name: req.body.username,
                            password: users.encrypt(req.body.password),
                            admin: JSON.parse(req.body.admin),
                            email: req.body.email
                        }
                    }, (err, result) => {
                        if (err) {
                            logger.logerror(err, "Update User");
                            res.cookie("currentMessage", "Unable to update");
                            res.redirect("/users");

                        } else {
                            logger.logDB("Update User", req.cookies.username);
                            res.cookie("currentMessage", "Updated User Successfully");
                            res.redirect('/users');

                        }
                    })
                }
            });

        })
    } else {
        res.cookie('currentMessage', "Must be Logged in to delete users");
        res.redirect('/Loginpage');
    }
});

app.get("/forgotPassword", async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        res.cookie("currentMessage", "Already Logged In");
        res.redirect('/');
        return;
    }
    res.render('forgotPassword.hbs', {
        user: req.cookies.username, site: site,
        admin: JSON.parse(req.cookies.admin),
        currentMessage: req.cookies.currentMessage,
    });
    res.clearCookie('currentMessage');
});

app.get("/forgotUsername", async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        res.cookie("currentMessage", "Already Logged In");
        res.redirect('/');
        return;
    }
    res.render('forgotUsername.hbs', {
        user: req.cookies.username, site: site,
        admin: JSON.parse(req.cookies.admin),
        currentMessage: req.cookies.currentMessage,
    });
    res.clearCookie('currentMessage');
});

app.post("/forgotPassword", async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        res.cookie("currentMessage", "Already Logged In");
        res.redirect('/');
        return;
    }
    db.collection('users').findOne({email: req.body.email}, (err, result) => {
        if (err)
            logger.logerror(err, "Finding User Email");
        else if (result === null) {
            logger.logDB("Finding User Email", req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Anonymous", "Failed (No email Exists)");
            res.cookie("currentMessage", "Sorry Email not found! Please Visit Contact Us Page for more help");
            res.redirect('/forgotPassword');
            return;
        } else {
            let range = require('./users').range;
            let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz0123456789";
            let x = 12;
            let string = '';
            for (let j in range(0, x)) {
                string = `${string}${possible.charAt(Math.floor(Math.random() * possible.length))}`;
            }
            db.collection('users').updateOne({email: req.body.email}, {
                $set: {
                    password: users.encrypt(string)
                }
            }, (err, result1) => {
                if (err)
                    logger.logerror(err, "Setting User Password (Forgotten)");
                else {
                    logger.loguser("Change Password (Forgot)", "Success", result.name);
                    let transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: 'agiledevproject@gmail.com',
                            pass: 'AgileDev1234'
                        }
                    });
                    let mailOptions = {
                        from: 'agiledevproject@gmail.com',
                        to: req.body.email,
                        subject: 'Forgotten Password',
                        text: `Hey there ${result.name}, \n
                        \nYour Password on ${site.SiteName} has been reset. Your new password is:
                        \n${string}
                        \nWe recommend signing into your account and changing the password as soon as possible. If this was not you or for more support, Visit the "Contact Us" page to get in touch with an Admin.`
                    };
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            logger.logerror(err, "Sending Forgot Password Email")
                        } else {
                            res.cookie("currentMessage", "Email Sent! If you do not receive an email within 24 hours, visit the Contact Us page to get help");
                            res.redirect('/Loginpage');
                            return;
                        }
                    });

                }
            });
        }
    });
});

app.post("/forgotUsername", async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        res.cookie("currentMessage", "Already Logged In");
        res.redirect('/');
        return;
    }
    db.collection('users').findOne({email: req.body.email}, (err, result) => {
        if (err)
            logger.logerror(err, "Finding User Email");
        else if (result === null) {
            logger.logDB("Finding User Email", req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Anonymous", "Failed (No email Exists)");
            res.cookie("currentMessage", "Sorry Email not found! Please Visit Contact Us Page for more help");
            res.redirect('/forgotUsername');
            return;
        } else {
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'agiledevproject@gmail.com',
                    pass: 'AgileDev1234'
                }
            });
            let mailOptions = {
                from: 'agiledevproject@gmail.com',
                to: req.body.email,
                subject: 'Forgotten Username',
                text: `Hey there, \n
                        \nYour username on ${site.SiteName} as requested is: 
                        \n${result.name} 
                        \nIf you did not click "Forgot Username?" or for more support, Visit the "Contact Us" page to get in touch with an Admin`
            };
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    logger.logerror(err, "Sending Forgot Password Email")
                } else {
                    res.cookie("currentMessage", "Email Sent! If you do not receive an email within 24 hours, visit the Contact Us page to get help");
                    res.redirect('/Loginpage');
                    return;
                }
            });

        }
    });
});

app.get('/account', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        let db = utils.getDb();
        db.collection('users').findOne({name: req.cookies.username}, (err, result) => {
            if (err)
                logger.logerror(err, "Getting Account Details for accounts page");
            else if (result === null)
                logger.logDB("Getting account details for accounts page", req.cookies.username, "Failed (user not found)");
            else {
                result.password = users.decrypt(result.password);
                res.render('account.hbs', {
                    active: {User: true},
                    account: result,
                    user: req.cookies.username, site: site,
                    admin: JSON.parse(req.cookies.admin),
                    currentMessage: req.cookies.currentMessage,
                });
                res.clearCookie('currentMessage');
            }
        });
    } else {
        res.cookie('currentMessage', "Must be Logged in to view account details");
        res.redirect('/Loginpage');
    }
});

app.post('/changeEmail/:id', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        let db = utils.getDb();
        db.collection("users").updateOne({_id: ObjectId(req.params.id)}, {
            $set: {
                email: req.body.email
            }
        }, (err, result) => {
            if (err) {
                logger.logerror(err, "Update User");
                res.cookie("currentMessage", "Unable to update");
                res.redirect("/account");

            } else {
                logger.logDB("Update User", req.cookies.username);
                res.cookie("currentMessage", "Updated Successfully");
                res.redirect('/account');

            }
        })
    } else {
        res.cookie('currentMessage', "Must be Logged in to delete users");
        res.redirect('/Loginpage');
    }
});

app.post('/changePassword/:id', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        let db = utils.getDb();
        db.collection("users").updateOne({_id: ObjectId(req.params.id)}, {
            $set: {
                password: users.encrypt(req.body.password)
            }
        }, (err, result) => {
            if (err) {
                logger.logerror(err, "Update User");
                res.cookie("currentMessage", "Unable to update");
                res.redirect("/account");

            } else {
                logger.logDB("Update User", req.cookies.username);
                res.cookie("currentMessage", "Updated Successfully");
                res.redirect('/account');

            }
        })
    } else {
        res.cookie('currentMessage', "Must be Logged in to delete users");
        res.redirect('/Loginpage');
    }
});

app.post('/changeUsername/:id', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        let oldName = req.cookies.username;
        let db = utils.getDb();
        db.collection("users").updateOne({_id: ObjectId(req.params.id)}, {
            $set: {
                name: req.body.name
            }
        }, (err, result) => {
            if (err) {
                logger.logerror(err, "Update User");
                res.cookie("currentMessage", "Unable to update");
                res.redirect("/account");

            } else {
                logger.logDB("Update Username", req.cookies.username);
                res.cookie("username", req.body.name);
                res.cookie("currentMessage", "Updated Successfully");
                db.collection('sales').find().toArray((err, array) => {
                    if (err)
                        logger.logerror(err, "Update User");
                    else {
                        for (let i in array)
                            if (array[i].user === oldName)
                                db.collection("sales").updateOne({_id: ObjectId(array[i]._id)}, {
                                    $set: {
                                        user: req.body.name,
                                    }
                                });
                        db.collection("products").find().toArray((err, array) => {
                            if (err)
                                logger.logerror(err, "Update User");
                            else {
                                for (let i in array)
                                    if (array[i].reviews)
                                        for (let j in array[i].reviews)
                                            if (array[i].reviews[j].user === oldName) {
                                                array[i].reviews[j].user = req.body.name;
                                                db.collection('products').updateOne({_id: ObjectId(array[i]._id)}, {
                                                    $set: {
                                                        reviews: array[i].reviews
                                                    }
                                                })
                                            }

                            }
                        });
                    }
                });
                res.redirect('/account');
            }
        })
    } else {
        res.cookie('currentMessage', "Must be Logged in to delete users");
        res.redirect('/Loginpage');
    }
});

app.post('/deleteUserA/:id', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (loggedIn(req)) {
        let db = utils.getDb();
        db.collection("users").findOneAndDelete({_id: ObjectId(req.params.id)}, (err, result) => {
            if (err) {
                logger.logerror(err, "Delete User");
                res.cookie("currentMessage", "Unable to delete user");
                res.redirect("/account");
            } else {
                logger.logDB("Delete User", req.cookies.username);
                res.cookie("currentMessage", "Deleted Successfully");
                res.redirect('/Logout');

            }
        })
    } else {
        res.cookie('currentMessage', "Must be Logged in to delete users");
        res.redirect('/Loginpage');
    }
});

app.get('/site', async (req, res) => {
    let db = utils.getDb();
    if (loggedIn(req)) {
        users.checkAdmin(req.cookies.username, (result) => {
            if (!result) {
                res.cookie('currentMessage', 'Must be admin to view site details');
                res.redirect('/');
                return;
            }
            let db = utils.getDb();
            db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")}, (err, result) => {
                if (err)
                    logger.logerror(err, "Display Users");
                else if (!result) {
                    logger.logDB("Get Users", req.cookies.username, "Failed (Nothing Found)")
                } else {
                    res.render('site.hbs', {
                        site: result,
                        user: req.cookies.username,
                        admin: JSON.parse(req.cookies.admin),
                        currentMessage: req.cookies.currentMessage,
                        cart: req.cookies.cart,
                        title: "Users", active: {site: true}
                    });
                    res.clearCookie('currentMessage');
                }
            });
        })
    } else {
        res.cookie('currentMessage', "Must be Logged in to view users");
        res.redirect('/Loginpage');
    }
});

app.post('/editSite', async (req, res) => {
    let db = utils.getDb();
    if (loggedIn(req)) {
        users.checkAdmin(req.cookies.username, (result) => {
            if (!result) {
                res.cookie('currentMessage', 'Must be admin to edit site details');
                res.redirect('/');
                return;
            }
            let db = utils.getDb();
            let HomeImage = req.body.HomeImage;
            HomeImage = HomeImage.replace(/\s/g, '');
            HomeImage = HomeImage.split(",");
            db.collection("site").updateOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")}, {
                $set:{
                    CopyrightDate: req.body.CopyrightDate,
                    NavColor: req.body.NavColor,
                    SiteName: req.body.SiteName,
                    Logo: req.body.Logo,
                    PhoneNumber: req.body.PhoneNumber,
                    Email:req.body.Email,
                    Address:req.body.Address,
                    MapLink:req.body.MapLink,
                    ContactDescription:req.body.ContactDescription,
                    HomeImage:HomeImage,
                    HomeDescTitle:req.body.HomeDescTitle,
                    HomeDesc:req.body.HomeDesc,
                    HomeDescTitle2:req.body.HomeDescTitle2,
                    HomeDesc2:req.body.HomeDesc2,
                    CardImage1:req.body.CardImage1,
                    CardTitle1:req.body.CardTitle1,
                    CardDesc1:req.body.CardDesc1,
                    CardImage2:req.body.CardImage2,
                    CardTitle2:req.body.CardTitle2,
                    CardDesc2:req.body.CardDesc2,
                    CardImage3:req.body.CardImage3,
                    CardTitle3:req.body.CardTitle3,
                    CardDesc3:req.body.CardDesc3,
                    facebook: req.body.facebook,
                    linkedin: req.body.linkedin,
                    twitter: req.body.twitter,
                }
            }, (err, result) => {
                if (err)
                    logger.logerror(err, "Edit Site");
                else {
                    res.cookie("currentMessage", "Successfully Updated");
                    res.redirect("/site");
                }
            });
        })
    } else {
        res.cookie('currentMessage', "Must be Logged in to view users");
        res.redirect('/Loginpage');
    }
});

app.get("/clearServerVisitLogs", async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (req.cookies.username === "adminacc")
        utils.getDb().collection("logs").updateOne({logtype: "serverVisit"}, {
            $set: {
                logs: []
            }
        }, (err, result) => {
            if (err)
                logger.logerror(err, "clearing serverVisit Logs");
            else
                res.redirect('/logs')
        });
    else {
        logger.logerror("Clear Logs Failed Auth Problem", "/clearServerVisitLogs");
        res.redirect("/")
    }
});

app.get("/clearAllLogs", async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    if (req.cookies.username === "adminacc")
        utils.getDb().collection("logs").updateOne({logtype: "serverVisit"}, {
            $set: {
                logs: []
            }
        }, (err, result) => {
            if (err)
                logger.logerror(err, "clearing serverVisit Logs");
            else
                utils.getDb().collection("logs").updateOne({logtype: "userLogins"}, {
                    $set: {
                        logs: []
                    }
                }, (err, result) => {
                    if (err)
                        logger.logerror(err, "clearing userLogins Logs");
                    else
                        utils.getDb().collection("logs").updateOne({logtype: "dbUsage"}, {
                            $set: {
                                logs: []
                            }
                        }, (err, result) => {
                            if (err)
                                logger.logerror(err, "clearing dbUsage Logs");
                            else
                                res.redirect('/logs')
                        });
                });
        });
    else {
        logger.logerror("Clear Logs Failed Auth Problem", "/clearAllLogs");
        res.redirect("/")
    }
});

app.get('/cheat', async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    res.render('cheat.hbs', {site: site})
});

app.get("*", async (req, res) => {
    let db = utils.getDb();
    let site = await db.collection("site").findOne({_id: ObjectId("5dbdd9a31c9d440000b758d9")});
    loggedIn(req);
    res.render("404.hbs",{site: site,
        user: req.cookies.username,
        admin: JSON.parse(req.cookies.admin),
        currentMessage: req.cookies.currentMessage,
        title: "404",})
});

app.listen(port, () => {
    utils.init();
    console.log(`Listening on port ${port}`);
});