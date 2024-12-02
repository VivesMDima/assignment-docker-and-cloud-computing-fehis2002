let chai = require('chai');
const request = require('supertest');
const app = require('../app');
const { User } = require('../models/user');
const assert = require('assert');

process.env.NODE_ENV = 'test'

describe('Users', () => {

    let token;
    let userId;

    before((done) => {
        User.deleteMany({})
            .then(
                () => {
                    return request(app)
                        .post('/api/users')
                        .send({
                            name: 'first user',
                            email: 'firstuser@gmail.com',
                            password: 'firstuser'
                        })
                        .expect(200)

                })
            .then(() => {
                return request(app)
                    .post('/api/auth')
                    .send({
                        email: 'firstuser@gmail.com',
                        password: 'firstuser'
                    })
                    .expect(200)
            })
            .then((res) => {
                token = res.headers['x-auth-token'];
                userId = res.body._id;
                done();
            })
            .catch((err) => {
                console.log(err);
                done(err);
            });
    });

    after(async () =>{
        await User.deleteMany({});
    })

    describe('POST /users', () => {
        it('should register a user', (done) => {
            request(app)
                .post('/api/users')
                .send({
                    name: 'test user',
                    email: 'test@gmail.com',
                    password: 'test-password'
                })
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });

        it('should send an 400 error for invalid email', (done) => {
            request(app)
                .post('/api/users')
                .send({
                    name: 'test user',
                    email: 'test',
                    password: 'test-password'
                })
                .expect('Content-Type', 'text/html; charset=utf-8')
                .expect(400)
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });

        it('should seend an 400 error for short password', (done) => {
            request(app)
                .post('/api/users')
                .send({
                    name: 'test user',
                    email: 'test@gmail.com',
                    password: 'te'
                })
                .expect('Content-Type', 'text/html; charset=utf-8')
                .expect(400)
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });

        it('should send an 400 error for short name', (done) => {
            request(app)
                .post('/api/users')
                .send({
                    name: 'te',
                    email: 'test@gmail.com',
                    password: 'test-password'
                })
                .expect('Content-Type', 'text/html; charset=utf-8')
                .expect(400)
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });

        it('should send an 400 error for taken email', (done) => {
            request(app)
                .post('/api/users')
                .send({
                    name: 'test user',
                    email: 'firstuser@gmail.com',
                    password: 'test-password'
                })
                .expect('Content-Type', 'text/html; charset=utf-8')
                .expect(400)
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        })

        it('should aunthenticate user', (done) => {
            request(app)
                .post('/api/users')
                .send({
                    name: 'test user',
                    email: 'test@gmail.com',
                    password: 'test-password'
                });

            request(app)
                .post('/api/auth')
                .send({
                    email: 'test@gmail.com',
                    password: 'test-password'
                })
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(200)
                .expect((res) => {
                    assert(res.headers['x-auth-token'] !== undefined);
                })

            done();
        });
    });


    describe('GET /users', () => {
        it('should return logged in user info', (done) => {
            request(app)
                .get('/api/users/me')
                .set('x-auth-token', token)
                .expect(200)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(`/{_id: ${userId}, _name: first user, email: firstuser@gmail.com}}/`)

            done();
        });

        it('should send an 400 error for wrong/invalid token', (done) => {
            request(app)
                .get('/api/users/me')
                .set('x-auth-token', 'invalid token')
                .expect(400)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        })

    })
});