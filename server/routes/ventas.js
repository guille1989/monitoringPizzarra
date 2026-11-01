const Express = require("express");
const rute = Express();
const PedidoPizzarra = require("../models/pedidos_model");
const PuntosPizzarra = require("../models/puntos_modelo");
const { prepararFechas } = require("../utils/fechasVentas");

function pipelineVentas(filtro) {
  return [
    { $unwind: "$aux" },
    { $match: filtro },
    {
      $group: {
        _id: "$aux.local",
        total_ventas: {
          $sum: {
            $add: [
              { $ifNull: [{ $toDouble: "$aux.costo_pedido" }, 0] },
              { $ifNull: [{ $toDouble: "$aux.domi_costo" }, 0] },
            ],
          },
        },
        total_pedidos: { $sum: 1 },
      },
    },
    { $sort: { total_ventas: -1 } },
  ];
}

rute.get("/ventas/:periodo/:finicio/:ffin/:fhoy", async (req, res) => {
  let fechas;
  try {
    fechas = prepararFechas(req.params);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    const [results, resultsAnioAtras, puntos] = await Promise.all([
      PedidoPizzarra.aggregate(pipelineVentas(fechas.actual)),
      PedidoPizzarra.aggregate(pipelineVentas(fechas.anterior)),
      PuntosPizzarra.find(),
    ]);
    const campo = req.params.periodo === "ventasDia"
      ? "objetivo_venta_dia"
      : "objetivo_venta_mes";
    for (const element of [...results, ...resultsAnioAtras]) {
      const punto = puntos.find((item) => item.local === element._id);
      const objetivo = Number(punto?.[campo]);
      element.objetivo_ventas = Number.isFinite(objetivo) ? objetivo : 0;
    }
    res.json({ results, resultsAnioAtras, fechas: fechas.metadata });
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = rute;
