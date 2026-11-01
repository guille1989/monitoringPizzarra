import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { io } from "socket.io-client";

jest.mock("socket.io-client", () => ({ io: jest.fn() }));
jest.mock("react-modal", () => {
  const Modal = ({ isOpen, children }) => isOpen ? <div role="dialog">{children}</div> : null;
  Modal.setAppElement = jest.fn();
  return Modal;
});
jest.mock("react-datepicker", () => (props) => props.showMonthYearPicker
  ? <button onClick={() => props.onChange(new Date(2026, 9, 1))}>Elegir octubre 2026</button>
  : <button onClick={() => props.onChange(new Date(2026, 9, 20))}>Elegir 20 octubre</button>);
jest.mock("react-date-range", () => ({
  DateRangePicker: ({ ranges }) => <div data-testid="rango-borrador">
    {ranges[0].startDate.getDate()} a {ranges[0].endDate.getDate()}
  </div>,
}));
jest.mock("./components/ventas_component/ventas_box_main", () => (props) =>
  <div data-testid="ventas">{props.ventas} | {props.diasPeriodo} días | {props.periodoDeDatos}</div>);

const octubre = {
  results: [{ _id: "Local", total_ventas: 3100, total_pedidos: 31, objetivo_ventas: 5000 }],
  resultsAnioAtras: [],
  fechas: {
    inicio: "2026-10-01", fin: "2026-10-31", dias: 31, diasAnterior: 31,
    inicioAnterior: "2025-10-01", finAnterior: "2025-10-31",
  },
};
const dia = {
  ...octubre,
  fechas: { ...octubre.fechas, inicio: "2026-11-01", fin: "2026-11-01", dias: 1 },
};
let eventos;
let solicitudes;

beforeEach(() => {
  jest.spyOn(Date, "now").mockReturnValue(Date.UTC(2026, 10, 1, 20));
  eventos = {};
  solicitudes = [];
  io.mockImplementation(() => ({
    on: (evento, callback) => { eventos[evento] = callback; },
    disconnect: jest.fn(),
  }));
  global.fetch = jest.fn(async (url) => {
    solicitudes.push(url);
    const body = url.includes("/gastos/") ? { resultsAux: [] }
      : url.includes("/2026-10-01/2026-10-31/") ? octubre : dia;
    return { ok: true, json: async () => body };
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  delete global.fetch;
});

async function seleccionarOctubre() {
  await screen.findByTestId("ventas");
  fireEvent.click(screen.getByRole("button", { name: "Mes" }));
  await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "Filtrar fechas" }));
  fireEvent.click(screen.getByRole("button", { name: "Elegir octubre 2026" }));
}

test("aplica todo octubre y mantiene ese filtro al recibir un pedido nuevo", async () => {
  render(<App />);
  await seleccionarOctubre();
  expect(screen.getByTestId("rango-borrador")).toHaveTextContent("1 a 31");
  fireEvent.click(screen.getByRole("button", { name: "Aplicar fechas" }));
  await waitFor(() => expect(screen.getByTestId("ventas")).toHaveTextContent("3100 | 31 días | 2026-10-01 al 2026-10-31"));
  expect(solicitudes.some((url) => url.includes("/ventas/ventasMes/2026-10-01/2026-10-31/2026-11-01"))).toBe(true);
  const anteriores = solicitudes.length;
  act(() => eventos.db_change({}));
  await waitFor(() => expect(solicitudes.length).toBeGreaterThan(anteriores));
  const ultimaVenta = solicitudes.filter((url) => url.includes("/ventas/")).pop();
  expect(ultimaVenta).toContain("/ventas/ventasMes/2026-10-01/2026-10-31/2026-11-01");
  await screen.findByTestId("ventas");
});

test("cancelar la selección no cambia el rango aplicado ni consulta octubre", async () => {
  render(<App />);
  await seleccionarOctubre();
  const anteriores = solicitudes.length;
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(solicitudes.length).toBe(anteriores);
  expect(solicitudes.some((url) => url.includes("/2026-10-01/2026-10-31/"))).toBe(false);
});

test("el filtro de día envía una fecha ISO y el informe sigue disponible sin histórico", async () => {
  render(<App />);
  await screen.findByTestId("ventas");
  fireEvent.click(screen.getByRole("button", { name: "Filtrar fechas" }));
  fireEvent.click(screen.getByRole("button", { name: "Elegir 20 octubre" }));
  fireEvent.click(screen.getByRole("button", { name: "Aplicar fechas" }));
  await waitFor(() => expect(solicitudes.some((url) => url.endsWith("/2026-10-20"))).toBe(true));
  await screen.findByTestId("ventas");
  fireEvent.click(screen.getByRole("button", { name: "Ver informe" }));
  expect(screen.getByText("Sin ventas registradas en el periodo del año anterior.")).toBeInTheDocument();
});

test("una consulta anterior lenta no reemplaza los datos del nuevo filtro", async () => {
  let resolverAnterior;
  const fetchNormal = global.fetch;
  global.fetch = jest.fn((url, options) => {
    if (url.includes("/ventas/ventasDia/")) {
      return new Promise((resolve) => { resolverAnterior = resolve; });
    }
    return fetchNormal(url, options);
  });
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Mes" }));
  await screen.findByTestId("ventas");
  fireEvent.click(screen.getByRole("button", { name: "Filtrar fechas" }));
  fireEvent.click(screen.getByRole("button", { name: "Elegir octubre 2026" }));
  fireEvent.click(screen.getByRole("button", { name: "Aplicar fechas" }));
  await waitFor(() => expect(screen.getByTestId("ventas")).toHaveTextContent("31 días"));
  await act(async () => resolverAnterior({ ok: true, json: async () => dia }));
  expect(screen.getByTestId("ventas")).toHaveTextContent("31 días");
});

test("un error del servidor se muestra sin intentar renderizar datos inválidos", async () => {
  global.fetch = jest.fn(async () => ({ ok: false, json: async () => ({ error: "Rango inválido" }) }));
  render(<App />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Rango inválido");
  expect(screen.queryByTestId("ventas")).not.toBeInTheDocument();
});
