const Express = require("express");
const rute = Express();
const PedidoPizzarra = require("../models/pedidos_model");
const PuntosPizzarra = require("../models/puntos_modelo");
const moment = require("moment-timezone");
const pedidos_model = require("../models/pedidos_model");

// Ruta GET para ejecutar la agregación
rute.get("/ventas/:periodo/:finicio/:ffin/:fhoy", async (req, res) => {
  let periodo = req.params.periodo;
  let finicio = req.params.finicio;
  let ffin = req.params.ffin;
  let fhoy = req.params.fhoy.split(" ")[1]; // Solo la fecha
  let fhoyParse = moment(fhoy, "DD-MM-YYYY").format("YYYY-MM-DD");

  console.log("Periodo:", periodo);
  console.log("Fecha inicio:", finicio);
  console.log("Fecha fin:", ffin);
  console.log("Fecha hoy:", fhoy);
  console.log("Fecha hoy parse:", fhoyParse);

  const fechaHoyAux = moment().tz("America/Bogota").format("YYYY-MM-DD");
  const fechaHoy = moment().tz("America/Bogota").format("YYYY-MM-DD HH:mm:ss");
  const horaHoy = fechaHoy.split(" ")[1];      // "HH:mm"

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
  let fechaHoyAnioAtras = moment()
    .tz("America/Bogota")
    .subtract(1, "year")
    .format("YYYY-MM-DD");

  if (periodo === "ventasMes" && fechaHoy.split(" ")[0] < ffin) {
    ffin = fechaHoy.split(" ")[0];
    ffinHaceUnAño =
      fechaHoy.split(" ")[0].split("-")[0] -
      1 +
      "-" +
      fechaHoy.split(" ")[0].split("-")[1] +
      "-" +
      fechaHoy.split(" ")[0].split("-")[2];
  }

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
          total_ventas: { $sum: { $add: ["$aux.costo_pedido", "$aux.domi_costo"] } },
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
          total_ventas: { $sum: { $add: ["$aux.costo_pedido", "$aux.domi_costo"] } },
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
            { "aux.fecha_pedido": fhoyParse }
          ],
        },
      },
      {
        $group: {
          _id: "$aux.local",
          total_ventas: { $sum: { $add: ["$aux.costo_pedido", "$aux.domi_costo"] } },
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
          $or: [
            // Caso 1: Es hoy, consideramos la hora
            {
              $and: [
                { "aux.fecha_pedido": fhoyParse },
                { "aux.hora_pedido": { $lt: horaHoy } },
              ],
            },
            // Caso 2: No es hoy, solo fecha (ejemplo con fechaHoyAnioAtras exacta)
            {
              "aux.fecha_pedido": fechaHoyAnioAtras,
            },
          ],
        },
      },
      {
        $group: {
          _id: "$aux.local",
          total_ventas: { $sum: { $add: ["$aux.costo_pedido", "$aux.domi_costo"] } },
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

    console.log(results);

    const resultsAnioAtras =
      periodo === "ventasDia"
        ? await PedidoPizzarra.aggregate(pipelineVentasDiaAnioAtras)
        : await PedidoPizzarra.aggregate(pipelineVentasMesAnioAtras);

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

    res.json({ results, resultsAnioAtras });
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = rute;