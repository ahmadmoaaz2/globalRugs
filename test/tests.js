const assert = require('chai').assert;
const supertest = require('supertest');
const describe = require('mocha').describe;
const eq = require('../utils').eq;
const multiply = require('../utils').multiply;
const loggedIn = require('../utils').loggedIn;
const length = require('../utils').length;
const users = require('../users');
const server = supertest.agent("https://bad-donuts.herokuapp.com");

describe('app.js', () => {
    it('eq should return true if the two parameters are equal', () => {
        let result = eq(1,1);
        assert.equal(result, true);
        assert.typeOf(result, "boolean");
    });
    it('eq should return false if the two parameters are not equal', () => {
        let result = eq(1,2);
        assert.equal(result, false);
        assert.typeOf(result, "boolean");
    });
    it('multiply should return the product of the two numbers', () => {
        let result = multiply(5,5);
        assert.equal(result, 25);
        assert.typeOf(result, "string");
    });
    it('length should return the length of the given list', () => {
        let result = length([1,2,3,4]);
        assert.equal(result, 4);
        assert.typeOf(result, "number");
    });
    it("loggedIn should return true if the user is loggedIn", () => {
        req = {};
        req.cookies = {};
        let result = loggedIn(req);
        assert.equal(result, false);
        req.cookies.username = "adminacc";
        result = loggedIn(req);
        assert.equal(result, true)
    });
    it('test for / endpoint', (done) => {
        server
            .get('/')
            .expect(200)
            .expect("Content-type",/html/)
            .end((err, res) => {
                assert.equal(res.status, 200);
                done();
            })
    }).timeout(5000);
    it('test for /Loginpage endpoint', (done) => {
        server
            .get('/Loginpage')
            .expect(200)
            .expect("Content-type",/html/)
            .end((err, res) => {
                assert.equal(res.status, 200);
                done();
            })
    }).timeout(5000);
    it('test for /Makeaccountpage endpoint', (done) => {
        server
            .get('/Makeaccountpage')
            .expect(200)
            .expect("Content-type",/html/)
            .end((err, res) => {
                assert.equal(res.status, 200);
                done();
            })
    }).timeout(5000);
    it('test for /Adminmakeaccountpage endpoint', (done) => {
        server
            .get('/Adminmakeaccountpage')
            .expect(200)
            .expect("Content-type",/html/)
            .end((err, res) => {
                assert.equal(res.status, 302);
                done();
            })
    }).timeout(5000);
    it('test for /admincheck endpoint', (done) => {
        server
            .get('/admincheck')
            .expect(200)
            .expect("Content-type",/html/)
            .end((err, res) => {
                assert.equal(res.status, 200);
                done();
            })
    });
    it('test for /Contact endpoint', (done) => {
        server
            .get('/Contact')
            .expect(200)
            .expect("Content-type",/html/)
            .end((err, res) => {
                assert.equal(res.status, 200);
                done();
            });
    });
    it('test for /ShoppingCart endpoint', (done) => {
        server
            .get('/ShoppingCart')
            .expect(200)
            .expect("Content-type", /html/)
            .end((err, res) => {
                assert.equal(res.status, 302);
                done();
            });
    });
    it('test for /Logout endpoint', (done) => {
        server
            .get('/Logout')
            .expect(200)
            .expect("Content-type",/html/)
            .end((err, res) => {
                assert.equal(res.status, 302);
                done();
            });
    });
    it('test for /logs endpoint', (done) => {
        server
            .get('/logs')
            .expect(200)
            .expect("Content-type",/html/)
            .end((err, res) => {
                assert.equal(res.headers["set-cookie"][0], "currentMessage=Must%20be%20Logged%20in%20to%20view%20logs; Path=/");
                assert.equal(res.status, 302);
                server
                    .get('/Logout')
                    .expect(200)
                    .end((err, res) => {
                        assert.equal(res.status, 302);
                        let body = {};
                        body.name = "adminacc";
                        body.password = "asdf";
                        server
                            .post('/login')
                            .send(body)
                            .expect(200)
                            .end((err, res) => {
                                assert.equal(res.headers["set-cookie"][0], "username=adminacc; Path=/");
                                assert.equal(res.status, 302);
                                server
                                    .get('/logs')
                                    .expect(200)
                                    .expect("Content-type",/html/)
                                    .end((err, res) => {
                                        assert.equal(res.status, 200);
                                        server
                                            .get('/Logout')
                                            .expect(200)
                                            .end((err, res) => {
                                                assert.equal(res.status, 302);
                                                let body = {};
                                                body.name = "notadminacc";
                                                body.password = "asdf";
                                                server
                                                    .post('/login')
                                                    .send(body)
                                                    .expect(200)
                                                    .end((err, res) => {
                                                        assert.equal(res.headers["set-cookie"][0], "username=notadminacc; Path=/");
                                                        assert.equal(res.status, 302);
                                                        server
                                                            .get('/logs')
                                                            .expect(200)
                                                            .expect("Content-type",/html/)
                                                            .end((err, res) => {
                                                                assert.equal(res.status, 302);
                                                                done();
                                                            });
                                                    });
                                            });
                                    });
                            });
                    });
            });


    }).timeout(5000);
    it('test for /sales endpoint', (done) => {
        server
            .get("/Logout")
            .expect(200)
            .end((err, res) => {
                assert.equal(res.status, 302);
                server
                    .get('/sales')
                    .expect(200)
                    .expect("Content-type",/html/)
                    .end((err, res) => {
                        assert.equal(res.status, 302);
                        let body = {};
                        body.name = "adminacc";
                        body.password = "asdf";
                        server
                            .post('/login')
                            .send(body)
                            .expect(200)
                            .end((err, res) => {
                                assert.equal(res.headers["set-cookie"][0], "username=adminacc; Path=/");
                                assert.equal(res.status, 302);
                                server
                                    .get('/sales')
                                    .expect(200)
                                    .expect("Content-type",/html/)
                                    .end((err, res) => {
                                        assert.equal(res.status, 200);
                                        done();
                                    });
                            });
                    });
            });
    }).timeout(5000);
    it('test for /sales-add-form endpoint', (done) => {
        server
            .get('/Logout')
            .expect(200)
            .end((err, res) => {
                assert.equal(res.status, 302);
                server
                    .get('/sales-add-form')
                    .expect(200)
                    .expect("Content-type",/html/)
                    .end((err, res) => {
                        assert.equal(res.status, 302);
                        let body = {};
                        body.name = "adminacc";
                        body.password = "asdf";
                        server
                            .post('/login')
                            .send(body)
                            .expect(200)
                            .end((err, res) => {
                                assert.equal(res.headers["set-cookie"][0], "username=adminacc; Path=/");
                                assert.equal(res.status, 302);
                                server
                                    .get('/sales-add-form')
                                    .expect(200)
                                    .expect("Content-type",/html/)
                                    .end((err, res) => {
                                        assert.equal(res.status, 200);
                                        done();
                                    });
                            });
                    });
            })
    }).timeout(5000);
    it('test for /products endpoint', (done) => {
        server
            .get("/products")
            .expect(200)
            .end((err, res) => {
                assert.equal(res.status, 200);
                done();
            });
    }).timeout(5000);
    it('test for /products-add-form endpoint', (done) => {
        server
            .get('/Logout')
            .expect(200)
            .end((err, res) => {
                assert.equal(res.status, 302);
                server
                    .get('/products-add-form')
                    .expect(200)
                    .expect("Content-type",/html/)
                    .end((err, res) => {
                        assert.equal(res.status, 302);
                        let body = {};
                        body.name = "adminacc";
                        body.password = "asdf";
                        server
                            .post('/login')
                            .send(body)
                            .expect(200)
                            .end((err, res) => {
                                assert.equal(res.headers["set-cookie"][0], "username=adminacc; Path=/");
                                assert.equal(res.status, 302);
                                server
                                    .get('/products-add-form')
                                    .expect(200)
                                    .expect("Content-type",/html/)
                                    .end((err, res) => {
                                        assert.equal(res.status, 200);
                                        done();
                                    });
                            });
                    });
            });

    }).timeout(5000);
    it('test for /reviews endpoint', (done) => {
        server
            .get('/Logout')
            .expect(200)
            .end((err, res) => {
                assert.equal(res.status, 302);
                server
                    .get('/reviews')
                    .expect(200)
                    .expect("Content-type",/html/)
                    .end((err, res) => {
                        assert.equal(res.status, 200);
                        done();
                    });
            })
    }).timeout(5000);
    it('test for /login endpoint (making sure user is logged in)', (done) => {
        server
            .get("/Logout")
            .expect(200)
            .end((err, res) => {
                assert.equal(res.status, 302);
                let body = {};
                body.name = "adminacc";
                body.password = "asdf";
                server
                    .post('/login')
                    .send(body)
                    .expect(200)
                    .end((err, res) => {
                        assert.equal(res.headers["set-cookie"][0], "username=adminacc; Path=/");
                        assert.equal(res.status, 302);
                        server
                            .get('/review-form')
                            .expect(200)
                            .expect("Content-type", /html/)
                            .end((err, res) => {
                                assert.equal(res.status, 200);
                                let body = {};
                                body.name = "adminacc";
                                body.password = "asdf";
                                server
                                    .post('/login')
                                    .send(body)
                                    .expect(200)
                                    .end((err, res) => {
                                        assert.equal(res.headers["set-cookie"][0], "username=adminacc; Path=/");
                                        assert.equal(res.status, 302);
                                        done();
                                    });
                            });
                    });
            })
    }).timeout(5000);
});

describe('users.js', () => {
    it("Encrypt should hide the string", () => {
        let sampleString = "TesT123$";
        let stringTest = sampleString;
        sampleString = users.encrypt(sampleString);
        assert.equal(sampleString === stringTest, false)
    });
    it("Decrypt should show the original string", () => {
        let stringTest = "TesT123$";
        let sampleString = users.encrypt(stringTest);
        sampleString = users.decrypt(sampleString);
        assert.equal(sampleString, stringTest)
    });
});