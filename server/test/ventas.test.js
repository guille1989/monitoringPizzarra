const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const moment = require("moment-timezone");
const { prepararFechas } = require("../utils/fechasVentas");

const ahora = () => moment.tz("2026-11-01 15:30:00", "America/Bogota");
const octubre = {
  periodo: "ventasMes", finicio: "2026-10-01", ffin: "2026-10-31", fhoy: "2026-11-01",
};

function coincide(documento, filtro) {
  return Object.entries(filtro).every(([campo, valor]) => {
    if (campo === "$or") return valor.some((parte) => coincide(documento, parte));
    const dato = documento[campo];
    if (typeof valor !== "object") return dato === valor;
    return Object.entries(valor).every(([op, limite]) => {
      if (op === "$gte") return dato >= limite;
      if (op === "$lte") return dato <= limite;
      if (op === "$lt") return dato < limite;
      throw new Error(`Operador inesperado: ${op}`);
    });
  });
}

test("octubre incluye los días 1 y 31 completos y excluye septiembre y noviembre", () => {
  const fechas = prepararFechas(octubre, ahora());
  const pedidos = [
    { "aux.fecha_pedido": "2026-09-30", "aux.hora_pedido": "23:59:59", importe: 900 },
    { "aux.fecha_pedido": "2026-10-01", "aux.hora_pedido": "00:00:00", importe: 100 },
    { "aux.fecha_pedido": "2026-10-15", "aux.hora_pedido": "18:00:00", importe: 200 },
    { "aux.fecha_pedido": "2026-10-31", "aux.hora_pedido": "23:59:59", importe: 300 },
    { "aux.fecha_pedido": "2026-11-01", "aux.hora_pedido": "00:00:00", importe: 900 },
  ];
  const incluidos = pedidos.filter((pedido) => coincide(pedido, fechas.actual));
  assert.equal(incluidos.length, 3);
  assert.equal(incluidos.reduce((total, pedido) => total + pedido.importe, 0), 600);
  assert.deepEqual(fechas.anterior, {
    "aux.fecha_pedido": { $gte: "2025-10-01", $lte: "2025-10-31" },
  });
  assert.equal(fechas.metadata.dias, 31);
  assert.equal(fechas.metadata.horaCorte, null);
});

test("un día histórico se compara solo con el aniversario de ese día y sin recorte horario", () => {
  const fechas = prepararFechas({ ...octubre, periodo: "ventasDia", fhoy: "2026-10-20" }, ahora());
  assert.deepEqual(fechas.anterior, {
    "aux.fecha_pedido": { $gte: "2025-10-20", $lte: "2025-10-20" },
  });
  assert.equal(fechas.metadata.dias, 1);
  assert.ok(coincide({ "aux.fecha_pedido": "2025-10-20", "aux.hora_pedido": "23:59:59" }, fechas.anterior));
  assert.ok(!coincide({ "aux.fecha_pedido": "2026-10-20" }, fechas.anterior));
});

test("acepta la fecha del cliente antiguo sin depender del nombre del día", () => {
  const fechas = prepararFechas({ ...octubre, periodo: "ventasDia", fhoy: "martes, 20-10-2026" }, ahora());
  assert.equal(fechas.metadata.inicio, "2026-10-20");
});

test("hoy compara ambos años hasta la misma hora de Bogotá", () => {
  const fechas = prepararFechas({ ...octubre, periodo: "ventasDia", fhoy: "2026-11-01" }, ahora());
  for (const [anio, filtro] of [[2026, fechas.actual], [2025, fechas.anterior]]) {
    assert.ok(coincide({ "aux.fecha_pedido": `${anio}-11-01`, "aux.hora_pedido": "15:30:00" }, filtro));
    assert.ok(!coincide({ "aux.fecha_pedido": `${anio}-11-01`, "aux.hora_pedido": "15:30:01" }, filtro));
  }
});

test("un mes en curso usa los días transcurridos y devuelve el rango efectivo", () => {
  const fechas = prepararFechas({ ...octubre, finicio: "2026-11-01", ffin: "2026-11-30" }, ahora());
  assert.equal(fechas.metadata.fin, "2026-11-01");
  assert.equal(fechas.metadata.finAnterior, "2025-11-01");
  assert.equal(fechas.metadata.dias, 1);
});

test("el mes en curso incluye días anteriores aunque su hora sea posterior al corte de hoy", () => {
  const fechas = prepararFechas(octubre, moment.tz("2026-10-15 12:00:00", "America/Bogota"));
  assert.ok(coincide({ "aux.fecha_pedido": "2026-10-14", "aux.hora_pedido": "23:59:59" }, fechas.actual));
  assert.ok(!coincide({ "aux.fecha_pedido": "2026-10-15", "aux.hora_pedido": "12:00:01" }, fechas.actual));
  assert.equal(fechas.metadata.dias, 15);
});

test("un rango de un día tiene divisor uno", () => {
  const fechas = prepararFechas({ ...octubre, ffin: "2026-10-01" }, ahora());
  assert.equal(fechas.metadata.dias, 1);
});

test("los años bisiestos producen fechas válidas y días propios para cada año", () => {
  const fechas = prepararFechas({ ...octubre, finicio: "2024-02-01", ffin: "2024-02-29" }, ahora());
  assert.equal(fechas.metadata.finAnterior, "2023-02-28");
  assert.equal(fechas.metadata.dias, 29);
  assert.equal(fechas.metadata.diasAnterior, 28);
});

test("hoy se determina en Bogotá incluso cuando en UTC ya es el día siguiente", () => {
  const fechas = prepararFechas(octubre, moment.utc("2026-11-01T02:00:00Z"));
  assert.equal(fechas.metadata.fin, "2026-10-31");
  assert.equal(fechas.metadata.horaCorte, "21:00:00");
});

test("rechaza fechas imposibles, rangos invertidos, futuros y periodos desconocidos", () => {
  for (const params of [
    { ...octubre, finicio: "2026-10-32" },
    { ...octubre, finicio: "2026-10-31", ffin: "2026-10-01" },
    { ...octubre, finicio: "2026-12-01", ffin: "2026-12-31" },
    { ...octubre, periodo: "otro" },
    { ...octubre, periodo: "ventasDia", fhoy: "2026-02-30" },
  ]) assert.throws(() => prepararFechas(params, ahora()));
});

function cargarRuta() {
  let handler;
  const consultas = [];
  const router = { get: (_, callback) => { handler = callback; } };
  const modelos = {
    "../models/pedidos_model": { aggregate: async (pipeline) => {
      consultas.push(pipeline);
      return [{ _id: "Local", total_ventas: 600, total_pedidos: 3 }];
    } },
    "../models/puntos_modelo": { find: async () => [{ local: "Local", objetivo_venta_mes: 1000 }] },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../routes/ventas.js"), "utf8"), {
    require: (nombre) => {
      if (nombre === "express") return () => router;
      if (nombre === "../utils/fechasVentas") return { prepararFechas: (params) => prepararFechas(params, ahora()) };
      if (modelos[nombre]) return modelos[nombre];
      throw new Error(`Importación no prevista: ${nombre}`);
    },
    module: { exports: {} }, console,
  });
  return { handler, consultas };
}

function respuesta() {
  return {
    codigo: 200, body: null,
    status(codigo) { this.codigo = codigo; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("la ruta consulta ambos rangos y entrega los días al cliente", async () => {
  const { handler, consultas } = cargarRuta();
  const res = respuesta();
  await handler({ params: octubre }, res);
  assert.equal(res.codigo, 200);
  assert.equal(consultas.length, 2);
  assert.deepEqual(consultas[0][1].$match, prepararFechas(octubre, ahora()).actual);
  assert.deepEqual(consultas[1][1].$match, prepararFechas(octubre, ahora()).anterior);
  assert.equal(res.body.fechas.dias, 31);
  assert.equal(res.body.results[0].objetivo_ventas, 1000);
});

test("la ruta responde 400 sin consultar MongoDB si el rango es inválido", async () => {
  const { handler, consultas } = cargarRuta();
  const res = respuesta();
  await handler({ params: { ...octubre, finicio: "incorrecta" } }, res);
  assert.equal(res.codigo, 400);
  assert.equal(consultas.length, 0);
});
