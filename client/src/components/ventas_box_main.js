// SalesBox.jsx
import React from "react";
import VentasGauge from "./ventas_gauge"; // Asegúrate de importar VentasGauge desde su ubicación correcta

const SalesBox = ({ pedido, venta, maxValor, title }) => {
  // Función para formatear el valor como dinero
  const formatCurrency = (value) => {
    return value.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  console.log(pedido);

  return (
    <div>
      <div className="box_title_main">
        {title || (pedido ? pedido._id : "-")}
      </div>

      <div className="box">
        <div className="box_ventas">
          <div>
            <div className="box_venatas_text">Numero de pedidos:</div>
            <div>{pedido ? pedido.total_pedidos : 0}</div>
          </div>
          <div>
            <div className="box_venatas_text">Ticket medio:</div>
            <div>
              {venta && pedido
                ? formatCurrency(venta.total_ventas / pedido.total_pedidos)
                : 0}
            </div>
          </div>
          <div>
            <div className="box_venatas_text">Ventas Totales:</div>
            <div>{venta ? formatCurrency(venta.total_ventas) : 0}</div>
          </div>
        </div>
        <div className="box_ventas_gauge">
          <VentasGauge
            valor={venta ? venta.total_ventas : 0}
            maxValor={maxValor}
          />
        </div>
      </div>
    </div>
  );
};

export default SalesBox;
