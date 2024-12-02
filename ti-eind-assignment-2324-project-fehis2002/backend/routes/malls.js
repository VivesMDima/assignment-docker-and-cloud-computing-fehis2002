const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Mall, validateMall } = require('../models/mall');
const { Store, validateStore } = require('../models/store');
const { Employee, validateEmployee } = require('../models/employee');
const authorisation = require('../middleware/authorisation');
const admin = require('../middleware/admin');
const { APIError, convertToAPIError } = require('../utils/APIError');
/**
 * @swagger
 * components:
 *   securitySchemes: 
 *     ApiKeyAuth:
 *       type: apiKey
 *       in: header
 *       name: x-auth-token
 *   schemas:
 *     Store:
 *       type: object
 *       required:
 *         - name
 *         - type
 *       properties:
 *         name:
 *           type: string
 *         type:
 *           type: string
 *         malls:
 *           type: array
 *           items:
 *             type: string
 *             format: ObjectId
 *     Employee:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - type
 *         - salary
 *         - store
 *         - mall
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         type:
 *           type: string
 *           enum: [Manager, Employee, Intern]
 *         salary:
 *           type: number
 *         hireDate:
 *           type: string
 *           format: date-time
 *         store:
 *           type: string
 *           format: ObjectId
 *         mall:
 *           type: string
 *           format: ObjectId
 *     Mall:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - city
 *         - province
 *         - postalCode
 *       properties:
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         city:
 *           type: string
 *         province:
 *           type: string
 *         postalCode:
 *           type: string
 *         stores:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Store'
 *         employees:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Employee'
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
*/


/**
 * @swagger
 * /malls:
 *   get:
 *     summary: Returns a list of all malls
 *     tags: [Malls]
 *     responses:
 *       200:
 *         description: The list of malls
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Mall'
 */
router.get('/', async (req, res, next) => {
    try {
    const malls = await Mall.find({});
    res.send(malls);
    } catch (err) {
        next(convertToAPIError(err));
    }
});


/**
 * @swagger
 * /malls/{id}:
 *   get:
 *     summary: Get a mall by ID
 *     tags: [Malls]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The mall ID
 *     responses:
 *       200:
 *         description: The mall description by ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Mall'
 *       404:
 *         description: Mall not found
 */
router.get('/:id', async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            throw new new APIError('Id is not valid', 404)
        }

        const mall = await Mall.findById(req.params.id);
        if (!mall) {
            throw new APIError('Mall is not found', 404)
        }
        return res.send(mall);
    } catch (err) {
        next(convertToAPIError(err));
    }

});

/**
 * @swagger
 * /malls/{id}/stores:
 *   get:
 *     summary: Get all stores in a mall
 *     tags: [Stores]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The mall ID
 *     responses:
 *       200:
 *         description: List of stores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Store'
 *       404:
 *         description: Mall not found
 */
router.get('/:id/stores', async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            throw new APIError('Id is not valid', 404)
        }

        const mall = await Mall.findById(req.params.id);
        if (!mall) {
            throw new APIError('Mall is not found', 404)
        }

        const stores = await Store.find({ malls: req.params.id });
        return res.send(stores);
    } catch (err) {
        next(convertToAPIError(err));
    }
});

/**
 * @swagger
 * /malls/{id}/employees:
 *   get:
 *     summary: Get all employees in a mall
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The mall ID
 *     responses:
 *       200:
 *         description: List of employees
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Mall not found
 */
router.get('/:id/employees', async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            throw new APIError('Id is not valid', 404)
        }

        const mall = await Mall.findById(req.params.id);
        if (!mall) {
            throw new APIError('Mall is not found', 404)
        }

        const employees = await Employee.find({ mall: req.params.id })
        return res.send(employees);
    } catch (err) {
        next(convertToAPIError(err));
    }
});

/**
 * @swagger
 * /malls/{mallId}/{employeeId}:
 *   get:
 *     summary: Get a specific employee by ID in a mall
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: mallId
 *         schema:
 *           type: string
 *         required: true
 *         description: The mall ID
 *       - in: path
 *         name: employeeId
 *         schema:
 *           type: string
 *         required: true
 *         description: The employee ID
 *     responses:
 *       200:
 *         description: Employee data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Employee not found
 */
router.get('/:mallId/:employeeId', async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.mallId) || !mongoose.Types.ObjectId.isValid(req.params.employeeId)) {
            throw new APIError('Id is not valid', 404)
        }

        const mall = await Mall.findById(req.params.mallId);
        if (!mall) {
            throw new APIError('Mall is not found', 404)
        }

        const employee = await Employee.findOne({ mall: req.params.mallId, _id: req.params.employeeId });
        if (!employee) {
            throw new APIError('Employee not found', 404)
        }

        res.send(employee);
    } catch (err) {
        next(convertToAPIError(err));
    }
});

/**
 * @swagger
 * /malls:
 *   post:
 *     summary: Create a new mall
 *     tags: [Malls]
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
 *             - address
 *             - city
 *             - province
 *             - postalCode
 *            properties:
 *             name:
 *              type: string
 *              example: Ring Kortrijk
 *             address:
 *              type: string
 *              example: Ringlaan 34
 *             city:
 *              type: string
 *              example: Kortrijk
 *             province:
 *              type: string
 *              example: West-Vlaanderen
 *             postalCode:
 *              type: string
 *              example: 8500
 *     responses:
 *       200:
 *         description: The created mall
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Mall'
 *       401:
 *         description: Missing token.
 *       400:
 *         description: Invalid token
 */
router.post('/', authorisation, async (req, res, next) => {
    try {
        const result = validateMall(req.body);
        if (result.error) {
            throw new APIError(result.error.details[0].message, 400);
        }

        if (!req.body.postalCode) {
            throw new APIError(`postal code is required`, 400);
        }
        const mall = new Mall({
            name: req.body.name,
            address: req.body.address,
            city: req.body.city,
            province: req.body.province,
            postalCode: Number.parseInt(req.body.postalCode),
            stores: []
        });

        await mall.save();
        return res.send(mall);
    } catch (err) {
        next(convertToAPIError(err));
    }
});

/**
 * @swagger
 * /malls/{mallId}/{storeId}:
 *   post:
 *     summary: Add a store to a mall
 *     tags: [Malls]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: mallId
 *         schema:
 *           type: string
 *         required: true
 *         description: The mall ID
 *       - in: path
 *         name: storeId
 *         schema:
 *           type: string
 *         required: true
 *         description: The store ID
 *     responses:
 *       200:
 *         description: The updated mall
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Mall'
 *       404:
 *         description: Mall or Store not found
 *       401:
 *         description: Missing token.
 *       400:
 *         description: Invalid token
 */
router.post('/:mallId/:storeId', authorisation, async (req, res, next) => {
    try {
        const result = validateStore(req.body);
        if (result.error) {
            throw new APIError(result.error.details[0].message, 400);
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.mallId)) {
            throw new APIError("MallId is not valid", 404);
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.storeId)) {
            throw new APIError("StoreId is not valid", 404);
        }

        const mall = await Mall.findById(req.params.mallId);
        if (!mall) {
            throw new APIError("Mall not found", 404);
        }
        const store = await Store.findById(req.params.storeId);
        if (!store) {
            throw new APIError("Store not found", 404);

        }

        if (mall.stores.includes(req.params.storeId)) {
            throw new APIError(`Store already exists in mall`, 400);
        }

        mall.stores.push(store);
        store.malls.push(mall);
        await store.save();
        await mall.save();
        res.send(mall);
    } catch (err) {
        next(convertToAPIError(err));
    }
});

/**
 * @swagger
 * /malls/{mallId}/{storeId}/employees:
 *   post:
 *     summary: Add an employee to a store in a mall
 *     tags: [Employees]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: mallId
 *         schema:
 *           type: string
 *         required: true
 *         description: The mall ID
 *       - in: path
 *         name: storeId
 *         schema:
 *           type: string
 *         required: true
 *         description: The store ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *              - firstName
 *              - lastName
 *              - type
 *              - salary
 *             properties:
 *              firstName:
 *               type: string
 *               example: John 
 *              lastName:
 *               type: string
 *               example: Smith
 *              type:
 *               type: string
 *               enum: [Manager, Employee, Intern]
 *               example: Employee
 *              salary:
 *               type: number
 *               example: 1250
 *               description: Salary per month
 *              hireDate:
 *               type: string
 *               format: date-time
 *               example: 15-12-2019
 *     responses:
 *       200:
 *         description: The created employee
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Mall or Store not found
 *       401:
 *         description: Missing token.
 *       400:
 *         description: Invalid token
 */
router.post('/:mallId/:storeId/employees', authorisation, async (req, res, next) => {
    try {
        const result = validateEmployee(req.body);
        if (result.error) {
            throw new APIError(result.error.details[0].message);
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.mallId)) {
            throw new APIError("MallId is not valid", 404);
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.storeId)) {
            throw new APIError("StoreId is not valid", 404);
        }

        const mall = await Mall.findById(req.params.mallId);
        if (!mall) {
            throw new APIError("Mall not found", 404);
        }

        const store = await Store.findById(req.params.storeId);
        if (!store) {
            throw new APIError("Store not found", 404);
        }
        if (isNaN(new Date(req.body.hireDate))) {
            throw new APIError(`hire date is not a valid date`, 400);
        } else if (isNaN(req.body.salary)) {
            throw new APIError('salary must be a number', 400);
        } else if (req.body.type !== 'Manager' && req.body.type !== 'Employee' && req.body.type !== 'Intern') {
            throw new APIError(`type must be Manager, Employee or Intern`, 400);
        }
        const employee = new Employee({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            type: req.body.type,
            salary: req.body.salary,
            hireDate: Date(req.body.hireDate),
            store: req.params.storeId,
            mall: req.params.mallId
        });

        mall.employees.push(employee);
        await employee.save();
        await mall.save();
        res.send(employee);
    } catch (err) {
        next(convertToAPIError(err));
    }
});

/**
 * @swagger
 * /malls/{id}:
 *   delete:
 *     summary: Delete a mall by ID
 *     tags: [Malls]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The mall ID
 *     responses:
 *       200:
 *         description: Mall deleted
 *       400:
 *         description: Invalid token
 *       404:
 *         description: Mall not found
 *       401:
 *         description: Access Denied. No token provided
 *       403:
 *         description: Access denied. Forbidden request
 */
router.delete('/:id', [authorisation, admin], async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            throw new APIError('Id is not valid', 404);
        }

        const mall = await Mall.findByIdAndDelete(req.params.id);
        if (!mall) {
            throw new APIError("Mall not found", 404);
        }
        return res.send(mall);

    } catch (err) {
        next(convertToAPIError(err));
    }
});

/**
 * @swagger
 * /malls/{id}/employee/{employeeId}:
 *   delete:
 *     summary: Delete an employee from a mall by employee ID
 *     tags: [Employees]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The mall ID
 *       - in: path
 *         name: employeeId
 *         schema:
 *           type: string
 *         required: true
 *         description: The employee ID
 *     responses:
 *       200:
 *         description: Employee deleted
 *       404:
 *         description: Mall or Employee not found
 *       401:
 *         description: Missing token.
 *       403:
 *         description: Access denied. Forbidden request
 *       400:
 *         description: Invalid token
 */
router.delete('/:id/employee/:employeeId', [authorisation, admin], async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(req.params.employeeId)) {
            throw new APIError('Id is not valid', 404);
        }

        const mall = await Mall.findById(req.params.id);
        if (!mall) {
            throw new APIError("Mall not found", 404);
        }

        let employee = await Employee.findById(req.params.employeeId);;
        if (!employee) {
            throw new APIError("Employee not found", 404);
        }

        mall.employees = mall.employees.splice(employee, 1);
        employee = await Employee.findByIdAndDelete(req.params.employeeId);
        await mall.save();
        res.send(employee);
    } catch (err) {
        next(convertToAPIError(err));
    }
});

/**
 * @swagger
 * /malls/{id}:
 *   put:
 *     summary: Update a mall by ID
 *     tags: [Malls]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The mall ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *            type: object
 *            required:
 *             - name
 *             - address
 *             - city
 *             - province
 *             - postalCode
 *            properties:
 *             name:
 *              type: string
 *              example: Ring Kortrijk
 *             address:
 *              type: string
 *              example: Ringlaan 34
 *             city:
 *              type: string
 *              example: Kortrijk
 *             province:
 *              type: string
 *              example: West-Vlaanderen
 *             postalCode:
 *              type: string
 *              example: 8500
 *     responses:
 *       200:
 *         description: The updated mall
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Mall'
 *       404:
 *         description: Mall not found
 *       401:
 *         description: Missing token.
 *       400:
 *         description: Invalid token or Bad Request
 */
router.put('/:id', authorisation, async (req, res, next) => {
    try {
        const result = validateMall(req.body);
        if (result.error) {
            throw new APIError(result.error.details[0].message, 400);
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            throw new APIError('Id is not valid', 404);
        }

        const mall = await Mall.findById(req.params.id);
        if (!mall) {
            throw new APIError("Mall not found", 404);
        }

        mall.set({
            name: req.body.name,
            address: req.body.address,
            city: req.body.city,
            province: req.body.province,
            postalCode: Number.parseInt(req.body.postalCode)
        })

        await mall.save();

        return res.send(mall);
    } catch (err) {
        next(convertToAPIError(err));
    }
});

/**
 * @swagger
 * /malls/{id}/{employeeId}:
 *   put:
 *     summary: Update an employee in a mall by employee ID
 *     tags: [Employees]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The mall ID
 *       - in: path
 *         name: employeeId
 *         schema:
 *           type: string
 *         required: true
 *         description: The employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
*           schema:
 *             type: object
 *             required:
 *              - firstName
 *              - lastName
 *              - type
 *              - salary
 *             properties:
 *              firstName:
 *               type: string
 *               example: John 
 *              lastName:
 *               type: string
 *               example: Smith
 *              type:
 *               type: string
 *               enum: [Manager, Employee, Intern]
 *               example: Employee
 *              salary:
 *               type: number
 *               example: 1250
 *               description: Salary per month
 *              hireDate:
 *               type: string
 *               format: date-time
 *               example: 15-12-2019
 *     responses:
 *       200:
 *         description: The updated employee
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Mall or Employee not found
 *       401:
 *         description: Missing token.
 *       400:
 *         description: Invalid token
*/
router.put('/:id/:employeeId', authorisation, async (req, res, next) => {
    try {
        const result = validateEmployee(req.body);
        if (result.error) {
            throw new APIError(result.error.details[0].message, 400);
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(req.params.employeeId)) {
            throw new APIError('Id is not valid', 404);
        }

        const mall = await Mall.findById(req.params.id);
        if (!mall) {
            throw new APIError("Mall not found", 404);
        }

        const employee = await Employee.findById(req.params.employeeId);
        if (!employee) {
            throw new APIError("Employee not found", 404);
        }


        employee.set({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            type: req.body.type,
            salary: req.body.salary,
            hireDate: req.body.hireDate,
        });
        await employee.save();
        await mall.save();
        return res.send(employee);

    } catch (err) {
        next(convertToAPIError(err));
    }
});


module.exports.Router = router;