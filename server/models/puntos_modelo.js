const mongose = require('mongoose');
const puntosSchema = new mongose.Schema({
    local:{type: String},
    objetivo_venta_dia:{type: Number},
    objetivo_venta_mes:{type: Number},
})
module.exports = mongose.model('puntos', puntosSchema)