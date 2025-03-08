const mongose = require('mongoose');
const pedidosSchema = new mongose.Schema({
    aux:{type: Array},
    pedido:{type: Array}
})
module.exports = mongose.model('pedidos', pedidosSchema)