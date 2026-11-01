import { fechaDelCalendario, fechaParaCalendario, rangoMes } from "./fechas";

test("conserva el día elegido a medianoche sin convertirlo a otra zona horaria", () => {
  expect(fechaDelCalendario(new Date(2026, 9, 1))).toBe("2026-10-01");
  expect(fechaDelCalendario(new Date(2026, 9, 31))).toBe("2026-10-31");
  const dia = fechaParaCalendario("2026-10-01");
  expect([dia.getFullYear(), dia.getMonth(), dia.getDate()]).toEqual([2026, 9, 1]);
});

test("seleccionar octubre genera el rango completo, incluido el cambio de hora", () => {
  const rango = rangoMes(new Date(2026, 9, 15));
  expect(fechaDelCalendario(rango.startDate)).toBe("2026-10-01");
  expect(fechaDelCalendario(rango.endDate)).toBe("2026-10-31");
});

test("seleccionar febrero respeta los años bisiestos", () => {
  expect(fechaDelCalendario(rangoMes(new Date(2024, 1, 10)).endDate)).toBe("2024-02-29");
  expect(fechaDelCalendario(rangoMes(new Date(2025, 1, 10)).endDate)).toBe("2025-02-28");
});
