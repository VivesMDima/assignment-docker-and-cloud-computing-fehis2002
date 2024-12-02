const { User, validate } = require('../models/user');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const _ = require('lodash');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authorisation = require('../middleware/authorisation');
const { APIError, convertToAPIError } = require('../utils/APIError');

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the user
 *                 example: "John Doe"
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
 *         description: User registered successfully
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
 *         description: Invalid input or user already registered
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: User already registered. or validation error message
 */
router.post('/', async (req, res, next) => {
    try {
        const { error } = validate(req.body);
        if (error) {
            throw new APIError(error.details[0].message, 400);
        }

        let user = await User.findOne({ email: req.body.email });
        if (user) {
            throw new APIError("User is already registered", 400);
        }

        user = new User(_.pick(req.body, ['name', 'email', 'password']));

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);

        await user.save();
        res.send(_.pick(user, ['_id', 'name', 'email']));
    } catch (error) {
        next(convertToAPIError(error));
    }
});


/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get the current user's profile
 *     tags: [Users]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: The user's profile
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
 *       401:
 *         description: Unauthorized. Missing or invalid token.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: 'Unauthorized'
 */

router.get('/me', authorisation, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    res.send(user);
});

module.exports = router;
