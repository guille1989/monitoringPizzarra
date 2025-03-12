const Express = require("express");
const rute = Express();
const PedidoPizzarra = require("../models/pedidos_model");
const PuntosPizzarra = require("../models/puntos_modelo");
const moment = require("moment-timezone");
const pedidos_model = require("../models/pedidos_model");

// Ruta GET para ejecutar la agregación
rute.get("/ventas/:periodo", async (req, res) => {
  let periodo = req.params.periodo;
  try {
    const fechaHoy = moment().tz("America/Bogota").format("YYYY-MM-DD");
    const hoy = moment(); // Fecha actual
    const inicioMes = hoy.clone().startOf("month").format("YYYY-MM-DD"); // Inicio del mes como string
    const finMes = hoy.clone().endOf("month").format("YYYY-MM-DD"); // Fin del mes como string

    // Pipeline para obtener las ventas del día y del mes
    const pipelineVentasMes = [
      {
        $unwind: "$aux",
      },
      {
        $match: {
          $and: [
            { "aux.fecha_pedido": { $gte: inicioMes } },
            { "aux.fecha_pedido": { $lte: finMes } },
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

    const results =
      periodo === "ventasDia"
        ? await PedidoPizzarra.aggregate(pipelineVentasDia)
        : await PedidoPizzarra.aggregate(pipelineVentasMes);
    //console.log(results);

    const resultPuntos = await PuntosPizzarra.find();
    //Filtramos los objetivos de venta dia o mes dependiendo del parametro

    // Verificar que resultPuntos exista
    if (!Array.isArray(resultPuntos) || resultPuntos.length === 0) {
      
    } else {
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

    res.json(results);
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = rute;
