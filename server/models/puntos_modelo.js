const mongose = require('mongoose');
const puntosSchema = new mongose.Schema({
    local:{type: String}
})
module.exports = mongose.model('puntos', puntosSchema)