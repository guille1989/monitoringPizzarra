const Express = require("express");
const rute = Express();
const Gastos = require("../models/gastos_model");
const moment = require("moment");
require("moment/locale/es");

//Crudes para gastos
rute.get("/gastos/:periodo", async (req, res) => {
  let periodoMes = req.params.periodo;
  // Parsear y formatear a "Junio-2025"
  const fechaFormateada = moment(periodoMes, "dddd, DD-MM-YYYY")
    .locale("es")
    .format("MMMM-YYYY");

  // Capitalizar la primera letra
  const fechaFinal =
    fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
  //Gastos en general
  try {
    const results = await Gastos.aggregate([
      {
        $match: {
          FECHA_GASTO_fIJO: fechaFinal,
          LOCAL: { $in: ["Pizzarra-Popayan-Centro", "Pizzarra-Cali-Refugio"] },
        },
      },
      {
        $group: {
          _id: { LOCAL: "$LOCAL", FECHA: "$FECHA_GASTO_fIJO" },
          GASTOS: { $push: "$GASTOS" },
        },
      },
      {
        $project: {
          _id: 0,
          LOCAL: "$_id.LOCAL",
          FECHA_GASTO_fIJO: "$_id.FECHA",
          GASTOS: {
            $reduce: {
              input: "$GASTOS",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] },
            },
          },
        },
      },
      {
        $addFields: {
          TOTAL_GASTO: {
            $sum: {
              $map: {
                input: "$GASTOS",
                as: "g",
                in: { $toDouble: "$$g.monto" }, // Convierte string a número
              },
            },
          },
        },
      },
    ]);
    console.log("Resultados de gastos:", results);
    //Parseamos el result para regresar el total de gastos
    const totalGastosPopayan =
      results.length !== 0
        ? results.reduce((acc, gasto) => {
            if (gasto.LOCAL === "Pizzarra-Popayan-Centro")
              return (
                acc +
                gasto.GASTOS.reduce(
                  (sum, item) => sum + parseInt(item.monto),
                  0
                )
              );
            return acc;
          }, 0)
        : [];

    const totalGastosCali =
      results.length !== 0
        ? results.reduce((acc, gasto) => {
            if (gasto.LOCAL === "Pizzarra-Cali-Refugio")
              return (
                acc +
                gasto.GASTOS.reduce(
                  (sum, item) => sum + parseInt(item.monto),
                  0
                )
              );
            return acc;
          }, 0)
        : [];
    //
    const gastosParse =
      results.length !== 0
        ? parseResult(
            results.find((item) => item.LOCAL === "Pizzarra-Popayan-Centro")
          )
        : [];
    const gastosParseCali =
      results.length !== 0
        ? parseResult(
            results.find((item) => item.LOCAL === "Pizzarra-Cali-Refugio")
          )
        : [];

    const resultsAux = results.map((item) => {
      return {
        local: item.LOCAL,
        fecha: item.FECHA_GASTO_fIJO,
        gastos: item.GASTOS,
        totalGasto: item.TOTAL_GASTO,
        gastosParseados:
          item.LOCAL === "Pizzarra-Popayan-Centro"
            ? gastosParse
            : gastosParseCali,
      };
    });
    res.json({
      results,
      resultsAux,
      totalGastosPopayan,
      totalGastosCali,
      gastosParse,
      gastosParseCali,
    });
  } catch (error) {
    console.error("Error al obtener puntos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

//Parseamos el result para regresar el total de gastos
const parseResult = (results) => {
  let gastosParse = [];
  gastosParse.push(["Descripción", "Monto"]); // Encabezados de la tabla
  results.GASTOS.forEach((gasto) => {
    let obj = [];
    obj.push(gasto.descripcion, parseInt(gasto.monto));
    gastosParse.push(obj);
  });
  return gastosParse;
};

module.exports = rute;
