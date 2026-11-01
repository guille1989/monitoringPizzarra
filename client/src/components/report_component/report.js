import React from "react";
import "./MonthlySalesReport.css";

const MonthlySalesReport = ({
  mes,
  anio,
  results,
  resultsAnioAtras,
  rangoFechas,
  rangoAnterior,
}) => {
  const calcularVariacion = (actual, anterior) => {
    if (anterior === 0) return "N/A";
    return (((actual - anterior) / anterior) * 100).toFixed(1);
  };

  const formatCurrency = (value) =>
    value
      ? `$${value.toLocaleString("es-CO", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}`
      : "$0";

  const renderTable = (actual, historico) => {
    const anterior = historico || { total_ventas: 0, total_pedidos: 0, objetivo_ventas: 0 };
    const cumplimiento = actual.objetivo_ventas > 0 ? (
      (actual.total_ventas / actual.objetivo_ventas) *
      100
    ).toFixed(1) : "N/A";
    const cumplimientoAnterior = anterior.objetivo_ventas > 0 ? (
      (anterior.total_ventas / anterior.objetivo_ventas) *
      100
    ).toFixed(1) : "N/A";
    const variacionVentas = calcularVariacion(
      actual.total_ventas,
      anterior.total_ventas
    );
    const variacionPedidos = calcularVariacion(
      actual.total_pedidos,
      anterior.total_pedidos
    );
    const ticketActual = actual.total_pedidos > 0 ? actual.total_ventas / actual.total_pedidos : 0;
    const ticketAnterior = anterior.total_pedidos > 0 ? anterior.total_ventas / anterior.total_pedidos : 0;
    const variacionTicket = calcularVariacion(ticketActual, ticketAnterior);

    return (
      <div key={actual._id} className="table-container">
        <h3>{actual._id}</h3>
        {!historico && <p>Sin ventas registradas en el periodo del año anterior.</p>}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Indicador</th>
                <th>
                  {mes} {anio}
                </th>
                <th>
                  Periodo 1 año atrás
                  {rangoAnterior && <div>{rangoAnterior}</div>}
                </th>
                <th>Variación</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Ventas Totales</td>
                <td>{formatCurrency(actual.total_ventas)}</td>
                <td>{formatCurrency(anterior.total_ventas)}</td>
                <td className={variacionVentas < 0 ? "negative" : "positive"}>
                  {variacionVentas === "N/A" ? "N/A" : `${variacionVentas}%`}
                </td>
              </tr>
              <tr>
                <td>Pedidos</td>
                <td>{actual.total_pedidos}</td>
                <td>{anterior.total_pedidos}</td>
                <td className={variacionPedidos < 0 ? "negative" : "positive"}>
                  {variacionPedidos === "N/A" ? "N/A" : `${variacionPedidos}%`}
                </td>
              </tr>
              <tr>
                <td>Ticket Medio</td>
                <td>{formatCurrency(ticketActual)}</td>
                <td>{formatCurrency(ticketAnterior)}</td>
                <td className={variacionTicket < 0 ? "negative" : "positive"}>
                  {variacionTicket === "N/A" ? "N/A" : `${variacionTicket}%`}
                </td>
              </tr>
              <tr>
                <td>% Cumplimiento Meta</td>
                <td>
                  {cumplimiento === "N/A" ? "N/A" : `${cumplimiento}%`}{" "}
                  <span
                    className={cumplimiento >= 100 ? "positive" : "negative"}
                  >
                    {cumplimiento >= 100 ? "✔" : "✘"}
                  </span>
                </td>
                <td>
                  {cumplimientoAnterior === "N/A" ? "N/A" : `${cumplimientoAnterior}%`}{" "}
                  <span
                    className={
                      cumplimientoAnterior >= 100 ? "positive" : "negative"
                    }
                  >
                    {cumplimientoAnterior >= 100 ? "✔" : "✘"}
                  </span>
                </td>
                <td className={cumplimiento >= 100 ? "positive" : "negative"}>
                  {cumplimiento >= 100 ? "✔" : "✘"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="report-container">
      <h1>📊 Reporte de Ventas</h1>

      {rangoFechas && (
        <div className="date-range">
          <strong>📅 Reporte:</strong>
          <div>{rangoFechas}</div>
        </div>
      )}

      {results.map((actual) => {
        const anterior = resultsAnioAtras.find((r) => r._id === actual._id);
        return renderTable(actual, anterior);
      })}
    </div>
  );
};

export default MonthlySalesReport;
