const moment = require("moment-timezone");

const ZONA = "America/Bogota";
const FORMATO = "YYYY-MM-DD";

function leerFecha(valor) {
  // Compatibilidad con el cliente anterior: "martes, 20-10-2026".
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(valor || "")
    ? valor
    : (valor || "").match(/(?:^|\s)(\d{2}-\d{2}-\d{4})$/)?.[1];
  const formato = fecha === valor ? FORMATO : "DD-MM-YYYY";
  const resultado = moment.tz(fecha || "", formato, true, ZONA);
  if (!resultado.isValid()) throw new Error("La fecha no es válida.");
  return resultado;
}

function prepararFechas(params, ahora = moment.tz(ZONA)) {
  const { periodo } = params;
  if (!["ventasDia", "ventasMes"].includes(periodo)) {
    throw new Error("El periodo debe ser ventasDia o ventasMes.");
  }
  const hoy = ahora.clone().tz(ZONA).startOf("day");
  const inicio = leerFecha(periodo === "ventasDia" ? params.fhoy : params.finicio);
  const finSolicitado = leerFecha(periodo === "ventasDia" ? params.fhoy : params.ffin);
  if (inicio.isAfter(finSolicitado)) {
    throw new Error("La fecha inicial debe ser anterior o igual a la final.");
  }
  if (inicio.isAfter(hoy)) throw new Error("No se pueden consultar fechas futuras.");

  // Los meses cerrados se consultan completos. El mes en curso llega hasta hoy.
  const fin = moment.min(finSolicitado, hoy);
  const inicioAnterior = inicio.clone().subtract(1, "year");
  const finAnterior = fin.clone().subtract(1, "year");
  const horaCorte = fin.isSame(hoy, "day")
    ? ahora.clone().tz(ZONA).format("HH:mm:ss")
    : null;
  const fechaInicio = inicio.format(FORMATO);
  const fechaFin = fin.format(FORMATO);
  const fechaInicioAnterior = inicioAnterior.format(FORMATO);
  const fechaFinAnterior = finAnterior.format(FORMATO);

  function filtro(desde, hasta, corte) {
    const fechas = { "aux.fecha_pedido": { $gte: desde, $lte: hasta } };
    if (!corte) return fechas;
    return {
      ...fechas,
      $or: [
        { "aux.fecha_pedido": { $lt: hasta } },
        { "aux.fecha_pedido": hasta, "aux.hora_pedido": { $lte: corte } },
      ],
    };
  }

  return {
    actual: filtro(fechaInicio, fechaFin, horaCorte),
    anterior: filtro(fechaInicioAnterior, fechaFinAnterior, horaCorte),
    metadata: {
      inicio: fechaInicio,
      fin: fechaFin,
      inicioAnterior: fechaInicioAnterior,
      finAnterior: fechaFinAnterior,
      dias: fin.diff(inicio, "days") + 1,
      diasAnterior: finAnterior.diff(inicioAnterior, "days") + 1,
      horaCorte,
      zonaHoraria: ZONA,
    },
  };
}

module.exports = { prepararFechas };
