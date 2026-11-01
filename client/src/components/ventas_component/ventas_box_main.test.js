import { render, screen } from "@testing-library/react";
import SalesBox from "./ventas_box_main";

jest.mock("./ventas_gauge", () => () => null);

test.each([[3100, 31], [100, 1]])("el promedio de %s entre %s días incluye ambos extremos", (ventas, dias) => {
  render(<SalesBox
    local="Local" ventas={ventas} numeroPedidos={1} maxValor={5000}
    periodoDeDatos="2026-10-01 al 2026-10-31" periodoDeDatosAux="ventasMes"
    diasPeriodo={dias} diasPeriodoAnterior={dias}
  />);
  const promedio = screen.getByText("Promedio ventas dia:").parentElement;
  expect(promedio).toHaveTextContent(/100/);
  expect(promedio).not.toHaveTextContent(/Infinity|NaN/);
});
