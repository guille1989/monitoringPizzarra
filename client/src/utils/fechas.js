import moment from "moment-timezone";

export const hoyBogota = () => moment.tz("America/Bogota").format("YYYY-MM-DD");

// Un calendario devuelve una fecha civil local, no un instante que haya que
// convertir a Bogotá. Convertir medianoche desde España cambia el día elegido.
export const fechaDelCalendario = (date) => moment(date).format("YYYY-MM-DD");
export const fechaParaCalendario = (fecha) => moment(fecha, "YYYY-MM-DD", true).toDate();
export const formatearFecha = (fecha) =>
  moment(fecha, "YYYY-MM-DD", true).locale("es").format("dddd, DD-MM-YYYY");

export const rangoMes = (date) => ({
  startDate: moment(date).startOf("month").toDate(),
  endDate: moment(date).endOf("month").startOf("day").toDate(),
  key: "selection",
});
