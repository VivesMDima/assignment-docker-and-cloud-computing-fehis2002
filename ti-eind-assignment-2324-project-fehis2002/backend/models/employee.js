const mongoose = require('mongoose');
const Joi = require('joi');


const employeeSchema = mongoose.Schema({
    firstName:  { type: String, required: true },
    lastName: { type: String, required: true },
    type: { type: String, required: true, enum: ['Manager', 'Employee', 'Intern'] },
    salary: { type: Number, required: true},
    hireDate: {
        type: Date,
        default: new Date(),
    },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true},
    mall: { type: mongoose.Schema.Types.ObjectId, ref: 'Mall', required: true},
});

const Employee = mongoose.model('Employee', employeeSchema);

function validateEmployee(employee) {
    const schema = Joi.object({
        firstName: Joi.string().required().min(5).max(75),
        lastName: Joi.string().required().min(5).min(50),
        type: Joi.string().required().min(5).min(50),
        salary: Joi.number().required(),
        hireDate: Joi.date().required(),
    });
    return schema.validate(employee.body);
}

module.exports.Employee = Employee;
module.exports.validateEmployee = validateEmployee;