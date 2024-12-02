const Joi = require('joi');
const bcrypt = require('bcrypt');
const { User } = require('../models/user');
const mongoose = require('mongoose');
const _ = require('lodash');
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { convertToAPIError, APIError} = require('../utils/APIError')

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the user
 *           minLength: 5
 *           maxLength: 50
 *         email:
 *           type: string
 *           description: The email of the user
 *           minLength: 5
 *           maxLength: 255
 *           unique: true
 *         password:
 *           type: string
 *           description: The password of the user
 *           minLength: 5
 *           maxLength: 1024
 * 
 */

/**
 * @swagger
 * /auth:
 *   post:
 *     summary: Authenticate a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email of the user
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 description: The password of the user
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *         headers:
 *           x-auth-token:
 *             description: The authentication token
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: The user ID
 *                 name:
 *                   type: string
 *                   description: The name of the user
 *                 email:
 *                   type: string
 *                   description: The email of the user
 *       400:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: Invalid email or Invalid password
 *       404:
 *         description: Email not found
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: 'Invalid email'
 */

router.post('/', async (req, res, next) => {
    try {
    const { error } = validate(req.body);
    if(error) {
        throw new APIError(error.details[0].message, 400);
    }

    let user = await User.findOne({ email: req.body.email});
    if(!user) {
        throw new APIError("Invalid email", 404);
    }

    const validPassword = await bcrypt.compare(req.body.password, user.password);

    if(!validPassword) {
        throw new APIError("Invalid password", 400);
    }

    const token = user.generateAuthToken();

    res.header('x-auth-token', token).send(_.pick(user, ['_id', 'name', 'email']));
    } catch (error) {
        next(convertToAPIError(error));
    }
});

function validate(req) {
    const schema = Joi.object({
        email: Joi.string().min(5).max(255).required().email(),
        password: Joi.string().min(5).max(255).required()
    });
    return schema.validate(req);
}

module.exports = router;