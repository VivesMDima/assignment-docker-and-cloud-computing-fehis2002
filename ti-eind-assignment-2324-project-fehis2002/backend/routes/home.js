const express = require('express');
const router = express.Router();
const app = express();
const { convertToAPIError } = require('../utils/APIError');

router.get('/', (req, res, next) => {
    try {
        const host = req.get('host');
        res.render('index', { environment: app.get('env'), host: host });
    } catch (error) {
        next(convertToAPIError(error));
    }
})

module.exports = router;