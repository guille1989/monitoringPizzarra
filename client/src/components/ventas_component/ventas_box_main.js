// SalesBox.jsx
import React, { useEffect, useState } from "react";
import VentasGauge from "./ventas_gauge"; // Asegúrate de importar VentasGauge desde su ubicación correcta
import Switch from "@mui/material/Switch";
import Divider from "@mui/material/Divider";

const SalesBox = ({
  local,
  ventas,
  numeroPedidos,
  maxValor,
  title,
  ventasAtras,
}) => {
  // Función para formatear el valor como dinero
  const formatCurrency = (value) => {
    return value.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };
  console.log(ventasAtras);

  return (
    <div>
      <div className="box_title_main">
        <div style={{ width: "70%" }}>{title || (local ? local : "-")}</div>
      </div>

      <div className="box">
        <div className="box_ventas">
          <div>
            <div className="box_venatas_text">Numero de pedidos:</div>
            <div>
              {numeroPedidos ? numeroPedidos : 0}
              {/* Indicador de comparación */}
              {numeroPedidos &&
                ventasAtras.total_pedidos &&
                (() => {
                  const pedidosActuales = Number(numeroPedidos);
                  const pedidosAnteriores = Number(ventasAtras.total_pedidos);
                  const diferencia = pedidosActuales - pedidosAnteriores;
                  const porcentaje = (
                    (diferencia / pedidosAnteriores) *
                    100
                  ).toFixed(2);
                  const esPositivo = diferencia > 0;

                  return (
                    <span
                      style={{
                        color: esPositivo ? "green" : "red",
                        opacity: "0.7",
                        marginLeft: "5px",
                        fontWeight: "bold",
                        fontSize: "0.8em",
                      }}
                    >
                      {esPositivo ? "↑" : "↓"} {Math.abs(porcentaje)}%
                    </span>
                  );
                })()}
            </div>
          </div>
          <div>
            <div className="box_venatas_text">Ticket medio:</div>
            <div>
              {ventas && numeroPedidos
                ? formatCurrency(ventas / numeroPedidos)
                : 0}

              {/* Indicador de comparación */}
              {ventas &&
                numeroPedidos &&
                ventasAtras.total_ventas &&
                ventasAtras.total_pedidos &&
                (() => {
                  const pedidosActuales = Number(ventas / numeroPedidos);
                  const pedidosAnteriores = Number(
                    ventasAtras.total_ventas / ventasAtras.total_pedidos
                  );
                  const diferencia = pedidosActuales - pedidosAnteriores;
                  const porcentaje = (
                    (diferencia / pedidosAnteriores) *
                    100
                  ).toFixed(2);
                  const esPositivo = diferencia > 0;

                  return (
                    <span
                      style={{
                        color: esPositivo ? "green" : "red",
                        opacity: "0.7",
                        marginLeft: "5px",
                        fontWeight: "bold",
                        fontSize: "0.8em",
                      }}
                    >
                      {esPositivo ? "↑" : "↓"} {Math.abs(porcentaje)}%
                    </span>
                  );
                })()}
            </div>
          </div>
          <div>
            <div className="box_venatas_text">Ventas Totales:</div>
            <div>
              {ventas ? formatCurrency(ventas) : 0}

              {/* Indicador de comparación */}
              {ventas &&
                ventasAtras.total_ventas &&
                (() => {
                  const ventasActual = Number(ventas);
                  const ventasAnterior = Number(ventasAtras.total_ventas);
                  const diferencia = ventasActual - ventasAnterior;
                  const porcentaje = (
                    (diferencia / ventasAnterior) *
                    100
                  ).toFixed(2);
                  const esPositivo = diferencia > 0;

                  return (
                    <span
                      style={{
                        color: esPositivo ? "green" : "red",
                        opacity: "0.7",
                        marginLeft: "5px",
                        fontWeight: "bold",
                        fontSize: "0.8em",
                      }}
                    >
                      {esPositivo ? "↑" : "↓"} {Math.abs(porcentaje)}%
                    </span>
                  );
                })()}
            </div>
          </div>
        </div>
        <div className="box_ventas_gauge">
          <VentasGauge valor={ventas ? ventas : 0} maxValor={maxValor} />
        </div>
      </div>
      <Divider />
    </div>
  );
};

export default SalesBox;
