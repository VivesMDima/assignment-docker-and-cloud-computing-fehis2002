const request = require('supertest');
const app = require('../app');

process.env.NODE_ENV = 'test'


describe('Home', () => {
    describe('GET /', () => {
        it('should return the home page', (done) => {
            request(app)
                .get('/')
                .expect(200)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });

        it('should send a 404 error when trying to use an invalid url', (done) => {
            request(app)
                .get('/wrongUrl')
                .expect(404)
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end((err, res) => {
                    if (err) return done(err);
                    done();
                });
        });
    });
});
