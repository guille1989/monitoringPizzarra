const Express = require('express');
const rute = Express();
const PedidoPizzarra = require("../models/pedidos_model");
const moment = require("moment-timezone");


// Ruta GET para ejecutar la agregación
rute.get("/ventas", async (req, res) => {
  try {
    const fechaHoy = moment().tz("America/Bogota").format("YYYY-MM-DD");
    const pipeline = [
      {
        $unwind: "$aux",
      },
      {
        $match: {
          $and: [
            { "aux.fecha_pedido": { $gte: fechaHoy } },
            { "aux.fecha_pedido": { $lte: fechaHoy } },
          ],
        },
      },
      {
        $group: {
          _id: "$aux.local",
          total_ventas: { $sum: "$aux.costo_pedido" },
        },
      },
    ];
    const results = await PedidoPizzarra.aggregate(pipeline);
    res.json(results);
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

rute.get("/numero-pedidos", async (req, res) => {
  try {
    const fechaHoy = moment().tz("America/Bogota").format("YYYY-MM-DD");
    const pipeline = [
      {
        $unwind: "$aux",
      },
      {
        $match: {
          $and: [
            { "aux.fecha_pedido": { $gte: fechaHoy } },
            { "aux.fecha_pedido": { $lte: fechaHoy } },
          ],
        },
      },
      {
        $group: {
          _id: "$aux.local",
          total_pedidos: { $sum: 1 },
        },
      },
    ];
    const results = await PedidoPizzarra.aggregate(pipeline);
    res.json(results);
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = rute;