const Express = require("express");
const rute = Express();
const PedidoPizzarra = require("../models/pedidos_model");
const moment = require("moment-timezone");

// Ruta GET para ejecutar la agregación
rute.get("/ventas", async (req, res) => {
  try {
    const fechaHoy = moment().tz("America/Bogota").format("YYYY-MM-DD");

    const hoy = moment(); // Fecha actual
    const inicioDia = hoy.clone().startOf("day").format("YYYY-MM-DD"); // Inicio del día actual como string
    const finDia = hoy.clone().endOf("day").format("YYYY-MM-DD"); // Fin del día actual como string
    const inicioMes = hoy.clone().startOf("month").format("YYYY-MM-DD"); // Inicio del mes como string
    const finMes = hoy.clone().endOf("month").format("YYYY-MM-DD"); // Fin del mes como string

    /* 
    const pipeline = [
      { $unwind: "$aux" },
      {
        $facet: {
          ventasDia: [
            {
              $match: {
                "aux.fecha_pedido": { $gte: fechaHoy, $lte: fechaHoy },
              },
            },
            {
              $group: {
                _id: "$aux.local",
                total_ventas: { $sum: "$aux.costo_pedido" },
                total_pedidos: { $sum: 1 },
              },
            },
            { $sort: { total_ventas: -1 } },
          ],
          ventasMes: [
            {
              $match: {
                "aux.fecha_pedido": {
                  $gte: inicioMes,
                  $lte: finMes,
                },
              },
            },
            {
              $group: {
                _id: "$aux.local",
                total_ventas: { $sum: "$aux.costo_pedido" },
                total_pedidos: { $sum: 1 },
              },
            },
            { $sort: { total_ventas: -1 } },
          ],
        },
      },
    ];
    */

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
          total_pedidos: { $sum: 1 },
        },
      },
      {
        $sort: {
          total_ventas: -1, // Orden descendente (mayor a menor)
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
