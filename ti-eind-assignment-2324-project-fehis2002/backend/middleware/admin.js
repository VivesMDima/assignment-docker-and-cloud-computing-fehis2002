const {APIError} = require('../utils/APIError');

module.exports = (req, res, next) => {
    if(!req.user.isAdmin) {
        next(new APIError('Access denied. You must be an admin', 403));
    };
    next();
}