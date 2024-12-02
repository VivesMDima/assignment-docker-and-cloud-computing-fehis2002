const mongoose = require('mongoose');
const Joi = require('joi');

const storeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true},
    type: { type: String, required: true},
    malls: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Mall'}
    ]
});

const Store = mongoose.model('Store', storeSchema);

function validateStore(store) {
    const schema = Joi.object({
        name: Joi.string().required().min(5).max(75),
        type: Joi.string().required().min(5).min(50),
    });

    return schema.validate(store.body);
}


module.exports.Store = Store;
module.exports.storeSchema = storeSchema;
module.exports.validateStore = validateStore;