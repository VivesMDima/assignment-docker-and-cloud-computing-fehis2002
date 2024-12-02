let chai = require('chai');
const request = require('supertest');
const app = require('../app');
const { Mall } = require('../models/mall');
const { User } = require('../models/user');
const expect = chai.expect;

describe('Malls', () => {

    let token;
    let mallId;
    let adminToken;
    beforeEach((done) => {
        Mall.deleteMany({})
            .then(() => {
                return User.deleteMany({})
            })
            .then(() => {
                return request(app)
                    .post('/api/users')
                    .send({
                        name: 'admin',
                        email: 'admin@gmail.com',
                        password: 'admin123'
                    });
            })
            .then(() => {
                return User.updateOne({ email: 'admin@gmail.com' }, { $set: { isAdmin: true } });
            })
            .then(() => {
                return request(app)
                    .post('/api/auth')
                    .send({
                        email: 'admin@gmail.com',
                        password: 'admin123'
                    })
                    .expect(200);
            })
            .then((res) => {
                adminToken = res.headers['x-auth-token'];
                return request(app)
                    .post('/api/users')
                    .send({
                        name: 'first user',
                        email: 'firstuser@gmail.com',
                        password: 'firstuser'
                    });
            })
            .then(() => {
                return request(app)
                    .post('/api/auth')
                    .send({
                        email: 'firstuser@gmail.com',
                        password: 'firstuser'
                    });
            })
            .then((res) => {
                token = res.headers['x-auth-token'];
                return request(app)
                    .post('/api/malls')
                    .set('x-auth-token', token)
                    .send({ name: "First mall", address: "testAddress", city: "Kortrijk", postalCode: "5555", province: "West-Vlaanderen" })

            })
            .then((res) => {
                mallId = res.body._id;
                done();
            })
            .catch((err) => {
                console.log(err);
                done(err);
            })
    });

    after(async () => {
        await User.deleteMany({});
        await Mall.deleteMany({});
    });
    
    describe('GET /malls', () => {
        it('should return all malls', (done) => {
            request(app)
                .get('/api/malls')
                .expect(200)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .then((res) => {
                    expect(res.body).to.be.a('array');
                    done();
                })
                .catch((err) => {
                    console.log(err);
                    done(err);
                });

            it('should return a empty list of malls', (done) => {
                Mall.deleteMany({})
                    .then(() => {
                        return request(app)
                            .get('/api/malls')
                            .expect(200)
                            .expect('Content-Type', 'application/json; charset=utf-8')
                    }).then((res) => {
                        expect(res.body).to.be.a('array');
                        expect(res.body).to.be.empty;
                        done();
                    }).catch((err) => {
                        console.log(err);
                        done(err);
                    });
            });

            it('should return a mall based on a given id', (done) => {
                request(app)
                    .get('/api/malls/' + mallId)
                    .expect(200)
                    .expect('Content-Type', 'application/json; charset=utf-8')
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.be.a('object');
                        expect(res.body._id).to.equal(mallId);
                        return done();
                    })
            });

            it('should return a 404 error when given the wrong id', (done) => {
                request(app)
                    .get('/api/malls/wrongId')
                    .expect(404)
                    .expect('Content-Type', 'text/html; charset=utf-8')
                    .end((err, res) => {
                        if (err) return done(err);
                        return done();
                    });
            })


        });
    });

    describe('POST /malls', () => {
        it('should create a new mall', (done) => {
            request(app)
                .post('/api/malls')
                .set('x-auth-token', token)
                .send({ name: "CreatedMall", address: "testAddress", city: "Kortrijk", postalCode: "5555", province: "West-Vlaanderen" })
                .expect(200)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.be.a('object');
                    expect(res.body.name).to.equal('CreatedMall');
                    expect(res.body.address).to.equal('testAddress');
                    expect(res.body.city).to.equal('Kortrijk');
                    expect(res.body.postalCode).to.equal('5555');
                    expect(res.body.province).to.equal('West-Vlaanderen');
                    return done();
                });
        });

        it('should return an 401 error for missing token', (done) => {
            request(app)
                .post('/api/malls')
                .send({ name: "CreatedMall", address: "testAddress", city: "Kortrijk", postalCode: "5555", province: "West-Vlaanderen" })
                .expect(401)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });

        it('should return an 400 errror for invalid token', (done) => {
            request(app)
                .post('/api/malls')
                .set('x-auth-token', 'invalid token')
                .send({ name: "CreatedMall", address: "testAddress", city: "Kortrijk", postalCode: "5555", province: "West-Vlaanderen" })
                .expect(400)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });

        it('should return an 400 error for missing a required property', (done) => {
            request(app)
                .post('/api/malls')
                .set('x-auth-token', token)
                .send({ name: "CreatedMall", city: "Kortrijk", postalCode: "5555", province: "West-Vlaanderen" })
                .expect(400)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });

        it('should return an 400 error for using a invalid province', (done) => {
            request(app)
                .post('/api/malls')
                .set('x-auth-token', token)
                .send({ name: "CreatedMall", address: "testAddress", city: "Kortrijk", postalCode: "5555", province: "wrongProvince" })
                .expect(400)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });

        it('should return an 400 error for sending an empty body', (done) => {
            request(app)
                .post('/api/malls')
                .set('x-auth-token', token)
                .send({})
                .expect(400)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        })
    });

    describe('PUT /malls', () => {
        it('should return an updated mall', (done) => {
            request(app)
                .put('/api/malls/' + mallId)
                .set('x-auth-token', token)
                .send({ name: "UpdatedMall", address: "testAddress", city: "Kortrijk", postalCode: "5555", province: "West-Vlaanderen" })
                .expect(200)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.be.a('object');
                    expect(res.body.name).to.equal('UpdatedMall');
                    expect(res.body.address).to.equal('testAddress');
                    expect(res.body.city).to.equal('Kortrijk');
                    expect(res.body.postalCode).to.equal('5555');
                    expect(res.body.province).to.equal('West-Vlaanderen');
                    return done();

                });
        });

        it('should 401 error for missing token', (done) => {
            request(app)
                .put('/api/malls/' + mallId)
                .send({ name: "UpdatedMall", address: "testAddress", city: "Kortrijk", postalCode: "5555", province: "West-Vlaanderen" })
                .expect(401)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });

        it('should return an 400 error for invalid token', (done) => {
            request(app)
                .put('/api/malls/' + mallId)
                .set('x-auth-token', 'invalid token')
                .send({ name: "UpdatedMall", address: "testAddress", city: "Kortrijk", postalCode: "5555", province: "West-Vlaanderen" })
                .expect(400)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });

        it('should return an 404 error for giving a invalid id', (done) => {
            request(app)
                .put('/api/malls/wrongId')
                .set('x-auth-token', token)
                .send({ name: "UpdatedMall", address: "testAddress", city: "Kortrijk", postalCode: "5555", province: "West-Vlaanderen" })
                .expect(404)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });

        it('should return an 400 error when sending an empty body', (done) => {
            request(app)
                .put('/api/malls/' + mallId)
                .set('x-auth-token', token)
                .send({})
                .expect(400)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        })
    });

    describe('DELETE /malls', () => {
        it('should return an deleted mall as an admin', (done) => {
            request(app)
                .delete('/api/malls/' + mallId)
                .set('x-auth-token', adminToken)
                .expect(200)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.be.a('object');
                    expect(res.body._id).to.equal(mallId);
                    expect(res.body.name).to.equal('First mall');
                    expect(res.body.address).to.equal('testAddress');
                    expect(res.body.city).to.equal('Kortrijk');
                    expect(res.body.postalCode).to.equal('5555');
                    expect(res.body.province).to.equal('West-Vlaanderen');
                    return done();
                });
        });

        it('should return an 403 error when deleting a mall as an regular user', (done) => {
            request(app)
                .delete('/api/malls/' + mallId)
                .set('x-auth-token', token)
                .expect(403)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });

        it('should return an 401 error for missing token', (done) => {
            request(app)
                .delete('/api/malls/' + mallId)
                .expect(401)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });

        it('should return an 400 error for invalid token', (done) => {
            request(app)
                .delete('/api/malls/' + mallId)
                .set('x-auth-token', 'invalid token')
                .expect(400)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });

        it('should return an 404 error for invalid Id', (done) => {
            request(app)
                .delete('/api/malls/wrongId')
                .set('x-auth-token', adminToken)
                .expect(404)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        })
    });
});