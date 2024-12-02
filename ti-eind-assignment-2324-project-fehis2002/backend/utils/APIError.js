class APIError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        if(statusCode === 401) {
            this.status = 'Unauthorized';
        } else if (statusCode === 403) {
            this.status = 'Forbidden';
        } else if (statusCode === 404) {
            this.status = 'Not Found';
        } else if (statusCode === 400){
            this.status = 'Bad Request';
        } else {
            this.status = 'Error';
        }

        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports.APIError = APIError;
module.exports.convertToAPIError = function (error) {
    if(!(error instanceof APIError)) {
        return new APIError(error.message, 400)
    } else {
        return error;
    }
}