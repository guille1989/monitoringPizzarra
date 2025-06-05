const mongose = require("mongoose");
const gastosFijosPizzarraShema = new mongose.Schema({
  LOCAL: { type: String },
  FECHA_GASTO_fIJO: { type: String },
  GASTOS: { type: Array },
});
module.exports = mongose.model("gastos_fijos_pizzarras", gastosFijosPizzarraShema);