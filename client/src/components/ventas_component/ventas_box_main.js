// SalesBox.jsx
import React, { useEffect, useState } from "react";
import VentasGauge from "./ventas_gauge"; // Asegúrate de importar VentasGauge desde su ubicación correcta
import Switch from "@mui/material/Switch";
import Divider from '@mui/material/Divider';


const SalesBox = ({
  local,
  ventas,
  numeroPedidos,
  maxValor,
  title
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

  return (
    <div>
      <div className="box_title_main">
        <div style={{ width: "70%" }}>{title || (local ? local : "-")}</div>
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
          <VentasGauge valor={ventas ? ventas : 0} maxValor={maxValor} />
        </div>
      </div>
      <Divider/>
    </div>
  );
};

export default SalesBox;
