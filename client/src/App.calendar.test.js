import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";

jest.mock("socket.io-client", () => ({
  io: () => ({ on: jest.fn(), disconnect: jest.fn() }),
}));
jest.mock("react-modal", () => {
  const Modal = ({ isOpen, children }) => isOpen ? <div role="dialog">{children}</div> : null;
  Modal.setAppElement = jest.fn();
  return Modal;
});
jest.mock("./components/ventas_component/ventas_box_main", () => () => <div>Ventas cargadas</div>);

beforeEach(() => {
  jest.useFakeTimers("modern");
  jest.setSystemTime(new Date("2026-11-01T20:00:00Z"));
  global.fetch = jest.fn(async (url) => ({
    ok: true,
    json: async () => url.includes("/gastos/") ? { resultsAux: [] } : {
      results: [{ _id: "Local" }], resultsAnioAtras: [],
      fechas: { inicio: "2026-10-01", fin: "2026-10-31", dias: 31 },
    },
  }));
});

afterEach(() => {
  jest.useRealTimers();
  delete global.fetch;
});

test("los calendarios reales seleccionan octubre completo sin desplazar sus extremos", async () => {
  const { container } = render(<App />);
  await screen.findByText("Ventas cargadas");
  fireEvent.click(screen.getByRole("button", { name: "Mes" }));
  await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "Filtrar fechas" }));
  fireEvent.click(screen.getByLabelText("Mes completo"));
  fireEvent.click(container.querySelector(".react-datepicker__month-9"));
  expect(screen.getByLabelText("Mes completo")).toHaveValue("octubre 2026");
  // Se ejercita también el rango personalizado con los días del calendario real.
  const dias = () => [...container.querySelectorAll(".rdrDay:not(.rdrDayPassive)")];
  fireEvent.click(dias().find((boton) => boton.textContent === "1"));
  fireEvent.click(dias().find((boton) => boton.textContent === "31"));
  fireEvent.click(screen.getByRole("button", { name: "Aplicar fechas" }));
  await waitFor(() => expect(global.fetch.mock.calls.some(([url]) =>
    url.includes("/ventas/ventasMes/2026-10-01/2026-10-31/2026-11-01")
  )).toBe(true));
  await screen.findByText("Ventas cargadas");
});
