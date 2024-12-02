const express = require('express');
const morgan = require('morgan');
const config = require('config');
const malls = require('./routes/malls').Router;
const stores = require('./routes/stores').Router;
const home = require('./routes/home');
const users = require('./routes/users');
const auth = require('./routes/auth');
const app = express();
const port = process.env.PORT || 3000;
const host = process.env.IP || 'localhost'
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const mongoose = require("mongoose");
const { APIError } = require('./utils/APIError');
const path = require('path');
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Malls API",
            version: "0.1.0",
            description: "This is an documentation of the MAlls API with Swagger",
            contact: {
                name: "Fabian Ehis",
                url: "https://vives.be",
                email: "fabian.ehis@student.vives.be",
            },
        },
        servers: [
            {
                url: `http://${host}:${port}/api`,
            },
        ],
    },
    apis: ["./routes/*.js"]
};
const specs = swaggerJsdoc(options);


app.set('view engine', 'pug');
// Configure the views directory
app.set('views', path.join(__dirname, '../frontend/views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/malls', malls);
app.use('/api/stores', stores);
app.use('/', home);
app.use('/api/users', users);
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs)
);
app.use('/api/auth', auth);


console.log('Application Name: ', config.get('name'));

if (app.get('env') === 'development') {
    app.use(morgan('tiny'));
    console.log('Morgan enabled');
}

console.log('host is: ' + host);

mongoose.connect(`mongodb://localhost/${config.get('db').get("name")}`)
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.error('Could not connect to MongoDB...', err));



app.all('*', (req, res, next) => {
    next(new APIError(`Can not find ${req.originalUrl}`, 404));
})

app.use((error, req, res, next) => {
    if (error instanceof APIError) {
        res.status(error.statusCode).render("error", { status: error.status, statusCode: error.statusCode, message: error.message });
        return;
    }
})


if (!module.parent) {
    app.listen(port, () => { console.log("listening on port " + port) });
}

module.exports = app;
