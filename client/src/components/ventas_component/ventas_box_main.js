// SalesBox.jsx
import { useState } from "react";
import VentasGauge from "./ventas_gauge"; // Asegúrate de importar VentasGauge desde su ubicación correcta

import { getGPTResponse } from "../../services/openaiService";

const SalesBox = ({
  local,
  ventas,
  numeroPedidos,
  maxValor,
  title,
  ventasAtras,
  periodoDeDatos,
  periodoDeDatosAux,
  diasPeriodo = 1,
  diasPeriodoAnterior = diasPeriodo,
}) => {
  // Función para formatear el valor como dinero
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  const formatCurrency = (value) => {
    return value.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const handleSubmitGPT = async (e) => {
    e.preventDefault();
    const reply = await getGPTResponse(
      input,
      ventas,
      numeroPedidos,
      maxValor,
      ventasAtras,
      periodoDeDatos,
      periodoDeDatosAux
    );
    setResponse(reply);
  };

  //
  const renderPorcentaje = (valorActual, valorAnterior) => {
    if (valorActual && valorAnterior) {
      const actual = Number(valorActual);
      const anterior = Number(valorAnterior);
      const diferencia = actual - anterior;
      const porcentaje = ((diferencia / anterior) * 100).toFixed(2);
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
          {esPositivo ? "🟢" : "🔻"} {Math.abs(porcentaje)}%
        </span>
      );
    }

    return (
      <span
        style={{
          display: "inline-block",
          width: "8px",
          height: "8px",
          backgroundColor: "yellow",
          borderRadius: "50%",
          marginLeft: "10px",
        }}
      ></span>
    );
  };

  return (
    <div>
      <div className="box_title_main">
        <div style={{ width: "50%" }}>{title || (local ? local : "-")}</div>

        <div className="meta-indicator">
          <span className="label">🎯 Meta:</span>
          <span className="value">
            {formatCurrency(maxValor)} Progreso:{" "}
            {maxValor > 0 ? `${Math.round((ventas * 100) / maxValor)}%` : "N/A"}
          </span>
        </div>
      </div>

      <div>
        <div className="box">
          <div className="box_ventas">
            <div>
              <div className="box_venatas_text">Numero de pedidos:</div>
              <div>
                {numeroPedidos ? numeroPedidos : 0}
                {/* Indicador de comparación */}
                {renderPorcentaje(numeroPedidos, ventasAtras?.total_pedidos)}
              </div>
            </div>
            <div>
              <div className="box_venatas_text">Ticket medio:</div>
              <div>
                {ventas && numeroPedidos
                  ? formatCurrency(ventas / numeroPedidos)
                  : 0}

                {/* Indicador de comparación */}
                {renderPorcentaje(
                  ventas && numeroPedidos ? ventas / numeroPedidos : null,
                  ventasAtras?.total_ventas && ventasAtras?.total_pedidos
                    ? ventasAtras.total_ventas / ventasAtras.total_pedidos
                    : null
                )}
              </div>
            </div>
            {periodoDeDatosAux === "ventasMes" ? (
              <div>
                <div className="box_venatas_text">Promedio ventas dia:</div>
                <div>
                  {ventas && diasPeriodo > 0
                    ? formatCurrency(ventas / diasPeriodo)
                    : formatCurrency(0)}
                  {/* Indicador de comparación */}
                  {renderPorcentaje(
                    ventas / diasPeriodo,
                    ventasAtras?.total_ventas / diasPeriodoAnterior
                  )}
                </div>
              </div>
            ) : null}
            <div>
              <div className="box_venatas_text">Ventas Totales:</div>
              <div>
                {ventas ? formatCurrency(ventas) : 0}

                {/* Indicador de comparación */}
                {renderPorcentaje(ventas, ventasAtras?.total_ventas)}
              </div>
            </div>
          </div>
          <div className="box_ventas_gauge">
            <VentasGauge valor={ventas ? ventas : 0} maxValor={maxValor} />
          </div>
        </div>
        
        {/* 
        <div className="box_gastos">
          <div className="box_gastos_text">Resumen de Gastos</div>

          <div className="box_venatas_text" style={{ marginLeft: '10px' }}>Total de gastos</div>
        </div>
        */}
      </div>
    </div>
  );
};

export default SalesBox;
