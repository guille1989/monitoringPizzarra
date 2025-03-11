// SalesBox.jsx
import React from "react";
import VentasGauge from "./ventas_gauge"; // Asegúrate de importar VentasGauge desde su ubicación correcta
import Switch from "@mui/material/Switch";
import { useState } from "react";

const SalesBox = ({ local, ventas, numeroPedidos, maxValor, title }) => {
  const [periodo, setPeriodo] = useState("ventasDia"); // Estado inicial: "mes"

  const handleSelectPeriodo = (event) => {
    const nuevoPeriodo = event.target.checked ? "dia" : "mes";
    setPeriodo(nuevoPeriodo);
    return nuevoPeriodo; // Si necesitas retornarlo para otra lógica
  };

  // Función para formatear el valor como dinero
  const formatCurrency = (value) => {
    return value.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const label = { inputProps: { "aria-label": "Switch demo" } };

  return (
    <div>
      <div className="box_title_main">
        <div style={{ width: "70%" }}>{title || (local ? local : "-")}</div>

        <div className="select_mes_dia">
          <div>Mes</div>
          <Switch
            {...label}
            checked={periodo === "ventasDia"} // Controla el estado del Switch
            onChange={handleSelectPeriodo}
            color="default"
          />
          <div>dia</div>
        </div>
      </div>

      <div className="box">
        <div className="box_ventas">
          <div>
            <div className="box_venatas_text">Numero de pedidos:</div>
            <div>{numeroPedidos ? numeroPedidos : 0}</div>
          </div>
          <div>
            <div className="box_venatas_text">Ticket medio:</div>
            <div>
              {ventas && numeroPedidos
                ? formatCurrency(ventas / numeroPedidos)
                : 0}
            </div>
          </div>
          <div>
            <div className="box_venatas_text">Ventas Totales:</div>
            <div>{ventas ? formatCurrency(ventas) : 0}</div>
          </div>
        </div>
        <div className="box_ventas_gauge">
          <VentasGauge
            valor={ventas ? ventas : 0}
            maxValor={local === "Popayan-Centro" ? 2500000 : 1000000}
          />
        </div>
      </div>
    </div>
  );
};

export default SalesBox;
