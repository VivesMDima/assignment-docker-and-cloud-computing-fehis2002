const mongoose = require('mongoose');
const Joi = require('joi');
const { storeSchema } = require('./store');


const Mall = mongoose.model('Mall', ({
    name: { type: String, required: true},
    address: { type: String, required: true},
    city: { type: String, required: true },
    province:  { type: String, required: true, enum: ['West-Vlaanderen', 'Oost-Vlaanderen', 'Antwerpen', 'Limburg', 'Vlaams-Brabant', 'Waals-Brabant', 'Luik', 'Namen', 'Henegouwen' , 'Luxemburg'] },
    postalCode:  { type: String, required: true },
    stores: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Store'}
    ],
    employees: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }
    ]
}));

function validateMall(mall) {
    const schema = Joi.object({
        name: Joi.string().required().min(2).max(100),
        address: Joi.string().required().min(10),
        city: Joi.string().required().min(3),
        province: Joi.string().required().min(10),
        postalCode: Joi.string().required().min(4).max(4)
    });
    return schema.validate(mall.body);
};

module.exports.Mall = Mall;
module.exports.validateMall = validateMall