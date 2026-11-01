import React from "react";
import "../../App.css";
import moment from "moment-timezone";
import "moment/locale/es";
import { formatearFecha } from "../../utils/fechas";

const TopFechasHandling = ({
  Opcion,
  ViewMode,
  fechaHoy,
  rangeInicio,
  rangeFin,
  finConsultado,
}) => {
  const fechaFormateada = moment(fechaHoy, "YYYY-MM-DD", true)
    .locale("es")
    .format("MMMM-YYYY");

  // Capitalizar la primera letra
  const fechaFinal =
    fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);

  return (
    <div className="gauge-container">
      <div className="date-info">
        <span>{ViewMode === "ventasDia" && formatearFecha(fechaHoy)}</span>
        <span>
          {ViewMode === "ventasMes" && rangeInicio + " al " + (finConsultado || rangeFin)}
        </span>
        <span>{ViewMode === "gastos" && fechaFinal}</span>
      </div>
    </div>
  );
};

export default TopFechasHandling;
