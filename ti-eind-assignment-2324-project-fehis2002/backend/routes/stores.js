const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Store, validateStore } = require('../models/store');
const authorisation = require('../middleware/authorisation');
const { Mall } = require('../models/mall');
const admin = require('../middleware/admin');
const { APIError, convertToAPIError } = require('../utils/APIError');

/**
 * @swagger
 * /stores:
 *   get:
 *     summary: Get all stores
 *     tags: [Stores]
 *     responses:
 *       200:
 *         description: List of all stores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Store'
 */
router.get('/', async (req, res, next) => {
    try {
    const stores = await Store.find({});
    return res.send(stores);
    } catch (err) {
        next(convertToAPIError(err));
    }
});

/**
 * @swagger
 * /stores/{id}:
 *   get:
 *     summary: Get a store by ID
 *     tags: [Stores]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The store ID
 *     responses:
 *       200:
 *         description: Store data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Store'
 *       404:
 *         description: Store not found
 */
router.get('/:id', async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            throw new APIError("Id is not valid", 404)
        }

        const store = await Store.findById(req.params.id);
        if (!store) {
            throw new APIError("Store not found", 404)
        }
        res.send(store);
    } catch (err) {
        next(convertToAPIError(err));
    }
});

/**
 * @swagger
 * /stores:
 *   post:
 *     summary: Create a new store
 *     tags: [Stores]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *            type: object
 *            required:
 *             - name
 *             - type
 *            properties:
 *             name:
 *              type: string
 *              example: KFC
 *             type:
 *              type: string
 *              example: Fast food
 *     responses:
 *       200:
 *         description: The created store
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Store'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized. Missing or invalid token.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: 'Unauthorized' 
*/
router.post('/', authorisation, async (req, res, next) => {
    try {
        let result = validateStore(req.body);
        if (result.error) {
            throw new APIError(result.error.details[0].message, 404);
        }


        const store = new Store({
            name: req.body.name,
            type: req.body.type,
        });
        result = await store.save();
        return res.send(result);
    }
    catch (err) {
        next(convertToAPIError(err));

    }
});

/**
 * @swagger
 * /stores/{id}:
 *   put:
 *     summary: Update a store by ID
 *     tags: [Stores]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The store ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
  *           schema:
 *            type: object
 *            required:
 *             - name
 *             - type
 *            properties:
 *             name:
 *              type: string
 *              example: KFC
 *             type:
 *              type: string
 *              example: Fast food
 *     responses:
 *       200:
 *         description: The updated store
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Store'
 *       404:
 *         description: Store not found
 *       401:
 *         description: Missing token.
 *       400:
 *         description: Invalid token
*/
router.put('/:id', authorisation, async (req, res, next) => {
    try {
        let result = validateStore(req.body);
        if (result.error) {
            throw new APIError(result.error.details[0].message, 404);
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            throw new APIError("Id is not valid", 404);
        }
        const store = await Store.findById(req.params.id);
        if (!store) {
            throw new APIError("Store not found", 404);
        }
        store.set({
            name: req.body.name,
            type: req.body.type,
        });

        result = await store.save();
        res.send(store);
    } catch (err) {
        next(convertToAPIError(err));
    }

});

/**
 * @swagger
 * /stores/{id}:
 *   delete:
 *     summary: Delete a store by ID
 *     tags: [Stores]
 *     security:
 *       - ApiKeyAuth: [] 
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The store ID
 *     responses:
 *       200:
 *         description: Store deleted
 *       404:
 *         description: Store not found
 *       401:
 *         description: Missing token.
 *       403:
 *         description: Access denied. Forbidden request
 *       400:
 *         description: Invalid token
 */
router.delete('/:id', [authorisation, admin], async (req, res, next) => {
    try {
        let result = validateStore(req.body);
        if (result.error) {
            throw new APIError(result.error.details[0].message, 404)
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            throw new APIError("Id is not valid", 404);
        }

        const store = await Store.findByIdAndDelete(req.params.id);
        const malls = await Mall.find({});

        for (let mall of malls) {
            if (mall.stores.includes(store._id)) {
                mall.stores.splice(store._id, 1);
                await mall.save();
            }
        }

        res.send(store);

    } catch (err) {
        next(convertToAPIError(err));
    }
});


module.exports.Router = router;