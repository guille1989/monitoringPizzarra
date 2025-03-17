const Express = require("express");
const rute = Express();
const PedidoPizzarra = require("../models/pedidos_model");
const PuntosPizzarra = require("../models/puntos_modelo");
const moment = require("moment-timezone");
const pedidos_model = require("../models/pedidos_model");

// Ruta GET para ejecutar la agregación
rute.get("/ventas/:periodo/:finicio/:ffin", async (req, res) => {
  let periodo = req.params.periodo;
  let finicio = req.params.finicio;
  let ffin = req.params.ffin;
  const fechaHoy = moment().tz("America/Bogota").format("YYYY-MM-DD");

  // Calcular fechas hace un año
  let finicioHaceUnAño =
    parseInt(finicio.split("-")[0]) -
    1 +
    "-" +
    finicio.split("-")[1] +
    "-" +
    finicio.split("-")[2];
  let ffinHaceUnAño =
    parseInt(ffin.split("-")[0]) -
    1 +
    "-" +
    ffin.split("-")[1] +
    "-" +
    ffin.split("-")[2];
    let fechaHoyAnioAtras = moment().tz("America/Bogota").subtract(1, "year").format("YYYY-MM-DD");

  try {
    // Pipeline para obtener las ventas del día y del mes
  
    const pipelineVentasMes = [
      {
        $unwind: "$aux",
      },
      {
        $match: {
          $and: [
            { "aux.fecha_pedido": { $gte: finicio } },
            { "aux.fecha_pedido": { $lte: ffin } },
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
          total_ventas: -1, // Orden descendente por total_ventas
        },
      },
    ];

    const pipelineVentasMesAnioAtras = [
      {
        $unwind: "$aux",
      },
      {
        $match: {
          $and: [
            { "aux.fecha_pedido": { $gte: finicioHaceUnAño } },
            { "aux.fecha_pedido": { $lte: ffinHaceUnAño } },
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
          total_ventas: -1, // Orden descendente por total_ventas
        },
      },
    ];

    const pipelineVentasDia = [
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

    const pipelineVentasDiaAnioAtras = [
      {
        $unwind: "$aux",
      },
      {
        $match: {
          $and: [
            { "aux.fecha_pedido": { $gte: fechaHoyAnioAtras } },
            { "aux.fecha_pedido": { $lte: fechaHoyAnioAtras } },
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

    const results =
      periodo === "ventasDia"
        ? await PedidoPizzarra.aggregate(pipelineVentasDia)
        : await PedidoPizzarra.aggregate(pipelineVentasMes);

    const resultsAnioAtras = periodo === "ventasDia" ? await PedidoPizzarra.aggregate(pipelineVentasDiaAnioAtras) : await PedidoPizzarra.aggregate(
      pipelineVentasMesAnioAtras
    );

    const resultPuntos = await PuntosPizzarra.find();
    //Filtramos los objetivos de venta dia o mes dependiendo del parametro

    // Verificar que resultPuntos exista
    if (!Array.isArray(resultPuntos) || resultPuntos.length === 0) {
    } else {
      resultsAnioAtras.forEach((element) => {
        // Buscar el punto correspondiente
        const objetivoVentas = resultPuntos.find(
          (punto) => punto.local === element._id
        );

        if (objetivoVentas) {
          // Determinar qué valor usar según el periodo
          const campo =
            periodo === "ventasDia"
              ? "objetivo_venta_dia"
              : "objetivo_venta_mes";
          const valorCrudo = objetivoVentas[campo];

          // Convertir a string primero, luego a número
          const valorString = String(valorCrudo);
          const valorNumerico = Number(valorString);
          element.objetivo_ventas = isNaN(valorNumerico) ? 0 : valorNumerico;
        } else {
          console.warn(`No se encontró objetivo para ${element._id}`);
          element.objetivo_ventas = 0; // Valor por defecto
        }
      });

      results.forEach((element) => {
        // Buscar el punto correspondiente
        const objetivoVentas = resultPuntos.find(
          (punto) => punto.local === element._id
        );

        if (objetivoVentas) {
          // Determinar qué valor usar según el periodo
          const campo =
            periodo === "ventasDia"
              ? "objetivo_venta_dia"
              : "objetivo_venta_mes";
          const valorCrudo = objetivoVentas[campo];

          // Convertir a string primero, luego a número
          const valorString = String(valorCrudo);
          const valorNumerico = Number(valorString);
          element.objetivo_ventas = isNaN(valorNumerico) ? 0 : valorNumerico;
        } else {
          console.warn(`No se encontró objetivo para ${element._id}`);
          element.objetivo_ventas = 0; // Valor por defecto
        }
      });
    }

    res.json({results, resultsAnioAtras});
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = rute;
