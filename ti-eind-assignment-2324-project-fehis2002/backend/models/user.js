const Joi = require('joi');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('config');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50
    },

    email: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255,
        unique: true
    },

    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 1024
    },

    isAdmin: {
        type: Boolean,
        default: false,
        required: true
    }
});

userSchema.methods.generateAuthToken = function () {
    //code uit auth over token generatie
    const token = jwt.sign({_id: this._id, isAdmin : this.isAdmin}, config.get('jwtPrivateKey'), {expiresIn: "1h"}); //payload, private key
    return token;
}

const User = mongoose.model('User', userSchema);

function validateUser(user) {
    const schema = Joi.object({
        name: Joi.string().min(5).max(50).required(),
        email: Joi.string().min(5).max(255).email().required(),
        password: Joi.string().min(5).max(255).required()
    });
    return schema.validate(user);
}
exports.User = User;
exports.validate = validateUser;