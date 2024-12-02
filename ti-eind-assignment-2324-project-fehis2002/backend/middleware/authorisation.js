const jwt = require('jsonwebtoken');
const config = require('config');
const { APIError, convertToAPIError } = require('../utils/APIError');

module.exports = function (req, res, next) {
     try {
        const token = req.header('x-auth-token');
        if(!token) {
            throw new APIError('Access Denied. No token provided', 401);
        }

        const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
        req.user = decoded;
        next();
    } catch (err) {
        next(convertToAPIError(err))
    }
}