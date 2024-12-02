let chai = require('chai');
const request = require('supertest');
const app = require('../app');
const { Mall } = require('../models/mall');
const { User } = require('../models/user');
const { Store } = require('../models/store');
const { Employee } = require('../models/employee');
const assert = require('assert');
const expect = chai.expect;

process.env.NODE_ENV = 'test'

describe('Store', () => {
    let token;
    let storeId;
    let mallId;
    let adminToken;
    beforeEach((done) => {
        Mall.deleteMany({})
            .then(
                () => {
                    return User.deleteMany({});
                })
            .then(() => {
                return Store.deleteMany({});
            })
            .then((res) => {
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
                    .send({ name: "CreatedMall", address: "testAddress", city: "Kortrijk", postalCode: "5555", province: "West-Vlaanderen" })

            })
            .then((res) => {
                mallId = res.body._id;
                return request(app)
                    .post('/api/stores')
                    .set('x-auth-token', token)
                    .send({ name: "first Store", type: "Grocery" })
            })
            .then((res) => {
                storeId = res.body._id;
                return request(app)
                    .post(`/api/malls/${mallId}/${storeId}`)
                    .set('x-auth-token', token)
                    .send();

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
                done();
            })

            .catch((err) => {
                console.log(err);
                done(err);
            });
    });

    after(async () => {
        await User.deleteMany({});
        await Store.deleteMany({});
        await Mall.deleteMany({});
    });

    describe('GET /stores', () => {
        it('should return all stores', (done) => {
            request(app)
                .get('/api/stores')
                .expect(200)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.be.a('array');
                    expect(res.body[0]).to.be.a('object');
                    expect(res.body[0].name).to.equal('first Store');
                    expect(res.body[0].type).to.equal('Grocery');
                    return done();
                });
        });

        it('should return an empty list of stores', () => {
            Store.deleteMany({})
                .then(() => {
                    return request(app)
                        .get('/api/stores')
                        .expect(200)
                        .expect('Content-Type', 'application/json; charset=utf-8');

                }).then((res) => {
                    expect(res.body).to.be.a('array');
                    expect(res.body).to.be.empty;
                }).catch((err) => {
                    console.log(err);
                    done(err);
                });
        });

        it('should return a store by a given id', (done) => {
            request(app)
                .get('/api/stores/' + storeId)
                .expect(200)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.be.a('object');
                    expect(res.body.name).to.equal('first Store');
                    expect(res.body.type).to.equal('Grocery');
                    return done();
                });
        });

        it('should return an 404 error for invalid id', (done) => {
            request(app)
                .get('/api/stores/wrongId')
                .expect(404)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });

        it('should return a list of stores for a given mall', (done) => {
            request(app)
                .get(`/api/malls/${mallId}/stores`)
                .expect(200)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.be.an('array');
                    return done();
                });
        });

        it('should return an 404 error for listing stores of mall such that an invalid id is given', (done) => {
            request(app)
                .get(`/api/malls/wrongId/stores`)
                .expect(404)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });
    });


    describe('POST /stores', () => {
        it('should return created store', (done) => {
            request(app)
                .post('/api/stores')
                .set('x-auth-token', token)
                .send({ name: "second Store", type: "Fast food" })
                .expect(200)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.be.a('object');
                    expect(res.body.name).to.equal('second Store');
                    expect(res.body.type).to.equal('Fast food');
                    return done();
                });
        });

        it('should return an 400 error when missing a required property', (done) => {
            request(app)
                .post('/api/stores')
                .set('x-auth-token', token)
                .send({ name: "second Store" })
                .expect(400)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });

        it('should return an 40e rror for invalid token', (done) => {
            request(app)
                .post('/api/stores')
                .set('x-auth-token', 'invalid token')
                .send({ name: "second Store", type: "Fast food" })
                .expect(400)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });

        it('should return an 401 error for missing token', (done) => {
            request(app)
                .post('/api/stores')
                .send({ name: "second Store", type: "Fast food" })
                .expect(401)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });

        it('should return an 400 error for trying to create a store with a name that already exists', (done) => {
            request(app)
                .post('/api/stores')
                .set('x-auth-token', token)
                .send({ name: "first Store", type: "Clothes" })
                .expect(400)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        })

        it('should add the created store to a mall', (done) => {
            let createdStoreId;
            request(app)
                .post('/api/stores')
                .set('x-auth-token', token)
                .send({ name: "second Store", type: "Fast food" })
                .expect(200)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .then((res) => {
                    expect(res.body).to.be.a('object');
                    expect(res.body.name).to.equal('second Store');
                    expect(res.body.type).to.equal('Fast food');
                    createdStoreId = res.body._id;
                    return request(app)
                        .post(`/api/malls/${mallId}/${res.body._id}`)
                        .set('x-auth-token', token)
                        .send()
                        .expect(200)
                        .expect('Content-Type', 'application/json; charset=utf-8')
                })
                .then((res) => {
                    expect(res.body).to.be.a('object');
                    expect(res.body._id).to.equal(mallId);
                    expect(res.body.stores).to.be.a('array');
                    expect(res.body.stores[1]).to.equal(createdStoreId);
                    done();
                }).catch((err) => {
                    console.log(err);
                    done(err);
                })
        });

        it('should send an 400 error when trying to add a store to mall that is already in that given mall', (done) => {
            request(app)
                .post(`/api/malls/${mallId}/${storeId}`)
                .set('x-auth-token', token)
                .send()
                .expect(400)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        })

        it('should return an 404 error for wrong mallId is provided when adding a store to a mall', (done) => {
            let createdStoreId;
            request(app)
                .post('/api/stores')
                .set('x-auth-token', token)
                .send({ name: "second Store", type: "Fast food" })
                .expect(200)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .then((res) => {
                    expect(res.body).to.be.a('object');
                    expect(res.body.name).to.equal('second Store');
                    expect(res.body.type).to.equal('Fast food');
                    createdStoreId = res.body._id;
                    return request(app)
                        .post(`/api/malls/wrongId/${res.body._id}`)
                        .set('x-auth-token', token)
                        .send()
                        .expect(404)
                        .expect('Content-Type', 'text/html; charset=utf-8')

                }).then((res) => {
                    done();
                }).catch((err) => {
                    console.log(err);
                    done(err);
                })
        });

        it('should return an 404 error for when wrong storeId is provided when adding a store to a mall', (done) => {
            request(app)
                .post('/api/stores')
                .set('x-auth-token', token)
                .send({ name: "second Store", type: "Fast food" })
                .expect(200)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .then((res) => {
                    expect(res.body).to.be.a('object');
                    expect(res.body.name).to.equal('second Store');
                    expect(res.body.type).to.equal('Fast food');
                    createdStoreId = res.body._id;
                    return request(app)
                        .post(`/api/malls/${mallId}/wrongId`)
                        .set('x-auth-token', token)
                        .send()
                        .expect(404)
                        .expect('Content-Type', 'text/html; charset=utf-8')

                }).then((res) => {
                    done();
                }).catch((err) => {
                    console.log(err);
                    done(err);
                })
        });


        it('should return an 404 error for when wrong storeId and mallId is provided when adding a store to a mall', (done) => {
            request(app)
                .post('/api/stores')
                .set('x-auth-token', token)
                .send({ name: "second Store", type: "Fast food" })
                .expect(200)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .then((res) => {
                    expect(res.body).to.be.a('object');
                    expect(res.body.name).to.equal('second Store');
                    expect(res.body.type).to.equal('Fast food');
                    createdStoreId = res.body._id;
                    return request(app)
                        .post(`/api/malls/wrongMallId/wrongStoreId`)
                        .set('x-auth-token', token)
                        .send()
                        .expect(404)
                        .expect('Content-Type', 'text/html; charset=utf-8')

                }).then((res) => {
                    done();
                }).catch((err) => {
                    console.log(err);
                    done(err);
                })
        });

        it('should return a 401 error for missing token', (done) => {
            let createdStoreId;
            request(app)
                .post('/api/stores')
                .set('x-auth-token', token)
                .send({ name: "second Store", type: "Fast food" })
                .expect(200)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .then((res) => {
                    expect(res.body).to.be.a('object');
                    expect(res.body.name).to.equal('second Store');
                    expect(res.body.type).to.equal('Fast food');
                    createdStoreId = res.body._id;
                    return request(app)
                        .post(`/api/malls/${mallId}/${res.body._id}`)
                        .send()
                        .expect(401)
                        .expect('Content-Type', 'text/html; charset=utf-8')
                })
                .then(() => {
                    return done();
                }).catch((err) => {
                    console.log(err);
                    done(err);
                })
        });


        it('should return an 404 error for invalid token', (done) => {
            let createdStoreId;
            request(app)
                .post('/api/stores')
                .set('x-auth-token', token)
                .send({ name: "second Store", type: "Fast food" })
                .expect(200)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .then((res) => {
                    expect(res.body).to.be.a('object');
                    expect(res.body.name).to.equal('second Store');
                    expect(res.body.type).to.equal('Fast food');
                    createdStoreId = res.body._id;
                    return request(app)
                        .post(`/api/malls/${mallId}/${res.body._id}`)
                        .set('x-auth-token', 'invalid-token')
                        .send()
                        .expect(400)
                        .expect('Content-Type', 'text/html; charset=utf-8')
                })
                .then(() => {
                    return done();
                }).catch((err) => {
                    console.log(err);
                    done(err);
                })
        });
    });


    describe('PUT /stores', () => {
        it('should update a store', (done) => {
            request(app)
                .put(`/api/stores/${storeId}`)
                .set('x-auth-token', token)
                .send({ name: "second Store", type: "Fast food" })
                .expect(200)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .then((res) => {
                    expect(res.body).to.be.a('object');
                    expect(res.body.name).to.equal('second Store');
                    expect(res.body.type).to.equal('Fast food');
                    done();
                }).catch((err) => {
                    console.log(err);
                    done(err);
                });
        });

        it('should send a 404 error for wrong Id', (done) => {
            request(app)
                .put(`/api/stores/wrongId`)
                .set('x-auth-token', token)
                .send({ name: "second Store", type: "Fast food" })
                .expect(404)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .then((res) => {
                    done();
                }).catch((err) => {
                    console.log(err);
                    done(err);
                });
        });

        it('should send a 400 error for sending empty response', (done) => {
            request(app)
                .put(`/api/stores/${storeId}`)
                .set('x-auth-token', token)
                .send()
                .expect(400)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .then((res) => {
                    done();
                }).catch((err) => {
                    console.log(err);
                    done(err);
                });
        });

        it('should send a 400 error when sending sending a response with one required property missing', (done) => {
            request(app)
                .put(`/api/stores/${storeId}`)
                .set('x-auth-token', token)
                .send({ name: "second Store" })
                .expect(400)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .then((res) => {
                    done();
                }).catch((err) => {
                    console.log(err);
                    done(err);
                });
        });

        it('should send a 401 error when token is missing', (done) => {
            request(app)
                .put(`/api/stores/${storeId}`)
                .send({ name: "second Store", type: "Fast food" })
                .expect(401)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .then((res) => {
                    done();
                }).catch((err) => {
                    console.log(err);
                    done(err);
                });
        });

        it('should send a 400 error when token is invalid', (done) => {
            request(app)
                .put(`/api/stores/${storeId}`)
                .set('x-auth-token', 'invalid-token')
                .send({ name: "second Store", type: "Fast food" })
                .expect(400)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .then((res) => {
                    done();
                }).catch((err) => {
                    console.log(err);
                    done(err);
                });
        });
    });

    describe('DELETE /stores', () => {
        it('should send deleted store as an admin', (done) => {
            request(app)
                .delete(`/api/stores/${storeId}`)
                .set('x-auth-token', adminToken)
                .send()
                .expect(200)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .then((res) => {
                    expect(res.body).to.be.a('object');
                    expect(res.body.name).to.equal('first Store');
                    expect(res.body.type).to.equal('Grocery');
                    expect(res.body._id).to.equal(storeId);
                    return request(app)
                        .get('/api/malls/' + mallId)
                        .expect(200)
                        .expect('Content-Type', 'application/json; charset=utf-8')

                })
                .then((res) => {
                    expect(res.body).to.be.a('object');
                    if (res.body.stores[0] === storeId) {
                        throw new Error('Store was not deleted');

                    }
                    done();
                })
                .catch((err) => {
                    console.log(err);
                    done(err);
                });
        });

        it('should send an 403 error when trying to delete a store as a logged in user', (done) => {
            request(app)
                .delete(`/api/stores/${storeId}`)
                .set('x-auth-token', token)
                .expect(403)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .then((res) => {
                    done();
                }).catch((err) => {
                    console.log(err);
                    done(err);
                });
        })

        it('should send a 404 error for wrong Id', (done) => {
            request(app)
                .delete(`/api/stores/wrongId`)
                .set('x-auth-token', adminToken)
                .expect(404)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .then((res) => {
                    done();
                }).catch((err) => {
                    console.log(err);
                    done(err);
                });
        });

        it('should send a 401 error when token is missing', (done) => {
            request(app)
                .delete(`/api/stores/${storeId}`)
                .send()
                .expect(401)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .then((res) => {
                    done();
                }).catch((err) => {
                    console.log(err);
                    done(err);
                });
        });

        it('should send a 400 error when token is invalid', (done) => {
            request(app)
                .delete(`/api/stores/${storeId}`)
                .set('x-auth-token', 'invalid-token')
                .send()
                .expect(400)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .then((res) => {
                    done();
                }).catch((err) => {
                    console.log(err);
                    done(err);
                });
        });
    })
});