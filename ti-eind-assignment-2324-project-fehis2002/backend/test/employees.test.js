let chai = require('chai');
const request = require('supertest');
const app = require('../../app');
const { Mall } = require('../models/mall');
const { User } = require('../models/user');
const { Store } = require('../models/store');
const { Employee } = require('../models/employee');
const assert = require('assert');
const expect = chai.expect;

process.env.NODE_ENV = 'test'

describe('Employee', () => {
    let token
    let employeeId
    let mallId
    let storeId
    let adminToken
    beforeEach((done) => {
        User.deleteMany({})
            .then(() => Mall.deleteMany({}))
            .then(() => Store.deleteMany({}))
            .then(() => Employee.deleteMany({}))
            .then(() => request(app)
                .post('/api/users')
                .send({
                    name: 'first user',
                    email: 'firstuser@gmail.com',
                    password: 'firstuser'
                })
                .expect(200))
            .then(() => request(app)
                .post('/api/auth')
                .send({
                    email: 'firstuser@gmail.com',
                    password: 'firstuser'
                }))
            .then((res) => {
                token = res.headers['x-auth-token'];
                return request(app)
                    .post('/api/stores')
                    .set('x-auth-token', token)
                    .send({ name: "McDonalds", type: "Fast Food" })
                    .expect(200)
            })
            .then((res) => {
                storeId = res.body._id;
                return request(app)
                    .post('/api/malls')
                    .set('x-auth-token', token)
                    .send({ name: "FrunPark", address: "krekelstraat 35", postalCode: "8870", province: "West-Vlaanderen", city: "Izegem" })
                    .expect(200)
            })
            .then((res) => {
                mallId = res.body._id;
                return request(app)
                    .post(`/api/malls/${mallId}/${storeId}/employees`)
                    .set('x-auth-token', token)
                    .send({ firstName: "John B.", lastName: "Derick", type: "Employee", salary: 1250, hireDate: new Date() })
                    .expect(200)
            })
            .then((res) => {
                employeeId = res.body._id;
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

    })

    after(async () => {
        await User.deleteMany({});
        await Store.deleteMany({});
        await Mall.deleteMany({});
        await Employee.deleteMany({});
    });

    describe('GET /employees', () => {
        it('should return a list of employees for a given mall', (done) => {
            request(app)
                .get(`/api/malls/${mallId}/employees`)
                .expect(200)
                .expect('Content-type', 'application/json; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.be.a('array');
                    expect(res.body.length).to.equal(1);
                    expect(res.body[0].firstName).to.equal('John B.');
                    expect(res.body[0].lastName).to.equal('Derick');
                    expect(res.body[0].type).to.equal('Employee');
                    expect(res.body[0].salary).to.equal(1250);
                    done();
                });
        });


        it('should send a 404 error when giving an invalid MallId', (done) => {
            request(app)
                .get(`/api/malls/wrongId/employees`)
                .expect(404)
                .expect('Content-type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

        it('should return a specific employee given a valid mallId and EmployeeId', (done) => {
            request(app)
                .get(`/api/malls/${mallId}/${employeeId}`)
                .expect(200)
                .expect('Content-type', 'application/json; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.be.a('object');
                    expect(res.body.firstName).to.equal('John B.');
                    expect(res.body.lastName).to.equal('Derick');
                    expect(res.body.type).to.equal('Employee');
                    expect(res.body.salary).to.equal(1250);
                    done();
                });
        });


        it('should send an 404 error when trying to get a specific employee with invalid mallId', (done) => {
            request(app)
                .get(`/api/malls/wrongId/${employeeId}`)
                .expect(404)
                .expect('Content-type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

        it('should send an 404 error when trying to get a specific employee with invalid employeeId', (done) => {
            request(app)
                .get(`/api/malls/${mallId}/wrongId`)
                .expect(404)
                .expect('Content-type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

        it('should send an 404 error when trying to get a specific employee with invalid mallId and employeeId', (done) => {
            request(app)
                .get(`/api/malls/wrongId/wrongId`)
                .expect(404)
                .expect('Content-type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

    });

    describe('POST /employees', () => {
        it('should return created employee', (done) => {
            request(app)
                .post(`/api/malls/${mallId}/${storeId}/employees`)
                .set('x-auth-token', token)
                .send({ firstName: "Fabian E.", lastName: "Ehis", type: "Manager", salary: 5000, hireDate: new Date() })
                .expect(200)
                .expect('Content-type', 'application/json; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.be.a('object');
                    expect(res.body.firstName).to.equal('Fabian E.');
                    expect(res.body.lastName).to.equal('Ehis');
                    expect(res.body.type).to.equal('Manager');
                    expect(res.body.salary).to.equal(5000);
                    done();
                });
        });

        it('should send an 400 error when trying to create a customer with an non valid type', (done) => {
            request(app)
                .post(`/api/malls/${mallId}/${storeId}/employees`)
                .set('x-auth-token', token)
                .send({ firstName: "Fabian E.", lastName: "Ehis", type: "wrongType", salary: 5000, hireDate: new Date() })
                .expect(400)
                .expect('Content-type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

        it('should send an 400 error when trying to create a customer while not filling the required properties (one or more)', (done) => {
            request(app)
                .post(`/api/malls/${mallId}/${storeId}/employees`)
                .set('x-auth-token', token)
                .send({ firstName: "Fabian E.", lastName: "Ehis", salary: 5000, hireDate: new Date() })
                .expect(400)
                .expect('Content-type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

        it('should send an 400 error when entering the wrong datatype for salary', (done) => {
            request(app)
                .post(`/api/malls/${mallId}/${storeId}/employees`)
                .set('x-auth-token', token)
                .send({ firstName: "Fabian E.", lastName: "Ehis", type: "Manager", salary: "notANumber", hireDate: new Date() })
                .expect(400)
                .expect('Content-type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

        it('should send a 400 eror when entering the wrong datatype for hireDate', (done) => {
            request(app)
                .post(`/api/malls/${mallId}/${storeId}/employees`)
                .set('x-auth-token', token)
                .send({ firstName: "Fabian E.", lastName: "Ehis", type: "Manager", salary: 5000, hireDate: "notADate" })
                .expect(400)
                .expect('Content-type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

        it('should send a 401 error when trying to create a employee with missing token', (done) => {
            request(app)
                .post(`/api/malls/${mallId}/${storeId}/employees`)
                .send({ firstName: "Fabian E.", lastName: "Ehis", type: "Manager", salary: 5000, hireDate: new Date() })
                .expect(401)
                .expect('Content-type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

        it('should send an 400 error when trying to create a employee with invalid token', (done) => {
            request(app)
                .post(`/api/malls/${mallId}/${storeId}/employees`)
                .set('x-auth-token', 'wrongToken')
                .send({ firstName: "Fabian E.", lastName: "Ehis", type: "Manager", salary: 5000, hireDate: new Date() })
                .expect(400)
                .expect('Content-type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

        it('should send an 404 error when trying to create a employee with invalid mallId', (done) => {
            request(app)
                .post(`/api/malls/wrongId/${storeId}/employees`)
                .set('x-auth-token', token)
                .send({ firstName: "Fabian E.", lastName: "Ehis", type: "Manager", salary: 5000, hireDate: new Date() })
                .expect(404)
                .expect('Content-type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

        it('should send an 404 error when trying to create a employee with invalid storeId', (done) => {
            request(app)
                .post(`/api/malls/${mallId}/wrongId/employees`)
                .set('x-auth-token', token)
                .send({ firstName: "Fabian E.", lastName: "Ehis", type: "Manager", salary: 5000, hireDate: new Date() })
                .expect(404)
                .expect('Content-type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });


    });


    describe('PUT /employees', () => {
        it('should return the updated employee', (done) => {
            request(app)
                .put(`/api/malls/${mallId}/${employeeId}`)
                .set('x-auth-token', token)
                .send({ firstName: "John F.", lastName: "Henry", type: "Intern", salary: 50, hireDate: new Date() })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.be.a('object');
                    expect(res.body.firstName).to.equal('John F.');
                    expect(res.body.lastName).to.equal('Henry');
                    expect(res.body.type).to.equal('Intern');
                    expect(res.body.salary).to.equal(50);
                    done();
                });
        });

        it('should send an 400 error when updating a few properties of an employee', (done) => {
            request(app)
                .put(`/api/malls/${mallId}/${employeeId}`)
                .set('x-auth-token', token)
                .send({ firstName: "John F.", lastName: "Henry" })
                .expect(400)
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

        it('should send an 400 error when sending an empty body', (done) => {
            request(app)
                .put(`/api/malls/${mallId}/${employeeId}`)
                .set('x-auth-token', token)
                .send({})
                .expect(400)
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

        it('should send an 404 error when updating a employee with invalid mallId', (done) => {
            request(app)
                .put(`/api/malls/wrongId/${employeeId}`)
                .set('x-auth-token', token)
                .send({ firstName: "John F.", lastName: "Henry", type: "Intern", salary: 50, hireDate: new Date() })
                .expect(404)
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

        it('should send an 404 error when updating a employee with invalid employeeId', (done) => {
            request(app)
                .put(`/api/malls/${mallId}/wrongId`)
                .set('x-auth-token', token)
                .send({ firstName: "John F.", lastName: "Henry", type: "Intern", salary: 50, hireDate: new Date() })
                .expect(404)
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

        it('should send an 404 erro when updating a employee with invalid mallId and employeeId', (done) => {
            request(app)
                .put(`/api/malls/wrongId/wrongId`)
                .set('x-auth-token', token)
                .send({ firstName: "John F.", lastName: "Henry", type: "Intern", salary: 50, hireDate: new Date() })
                .expect(404)
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

        it('should send an 401 error when updating a employee with missing token', (done) => {
            request(app)
                .put(`/api/malls/${mallId}/${employeeId}`)
                .send({ firstName: "John F.", lastName: "Henry", type: "Intern", salary: 50, hireDate: new Date() })
                .expect(401)
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

        it('should end and 400 error when updating a employee with invalid token', (done) => {
            request(app)
                .put(`/api/malls/${mallId}/${employeeId}`)
                .set('x-auth-token', 'wrongToken')
                .send({ firstName: "John F.", lastName: "Henry", type: "Intern", salary: 50, hireDate: new Date() })
                .expect(400)
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });
    })

    describe('DELETE /employees', () => {
        it('should return the deleted employee as an admin', (done) => {
            request(app)
                .delete(`/api/malls/${mallId}/employee/${employeeId}`)
                .set('x-auth-token', adminToken)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.be.a('object');
                    expect(res.body._id).to.equal(employeeId);
                    expect(res.body.firstName).to.equal('John B.');
                    expect(res.body.lastName).to.equal('Derick');
                    expect(res.body.type).to.equal('Employee');
                    expect(res.body.salary).to.equal(1250);
                    done();
                });
        });

        it('should send an 403 error when trying to delete an an employee as an loggen in user', (done) => {
            request(app)
                .delete(`/api/malls/${mallId}/employee/${employeeId}`)
                .set('x-auth-token', token)
                .expect(403)
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        })

        it('should send an 404 error when deleting a employee with invalid mallId', (done) => {
            request(app)
                .delete(`/api/malls/wrongId/employee/${employeeId}`)
                .set('x-auth-token', adminToken)
                .expect(404)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

        it('should send an 404 error when deleting a employee with invalid employeeId', (done) => {
            request(app)
                .delete(`/api/malls/${mallId}/employee/wrongId`)
                .set('x-auth-token', adminToken)
                .expect(404)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

        it('should send an 404 errror when deleting a employee with invalid mallId and employeeId', (done) => {
            request(app)
                .delete(`/api/malls/wrongId/employee/wrongId`)
                .set('x-auth-token', adminToken)
                .expect(404)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

        it('should send an 401 error when deleting a employee with missing token', (done) => {
            request(app)
                .delete(`/api/malls/${mallId}/employee/${employeeId}`)
                .expect(401)
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

        it('should send an 400 error when deleting a employee with invalid token', (done) => {
            request(app)
                .delete(`/api/malls/${mallId}/employee/${employeeId}`)
                .set('x-auth-token', 'wrongToken')
                .expect(400)
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });
    })
});