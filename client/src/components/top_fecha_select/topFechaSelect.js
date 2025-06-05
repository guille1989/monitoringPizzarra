import React, { useEffect } from "react";
import "../../App.css";
import moment from "moment-timezone";
import "moment/locale/es";

const TopFechasHandling = ({
  Opcion,
  ViewMode,
  fechaHoy,
  rangeInicio,
  rangeFin,
}) => {
  const fechaFormateada = moment(fechaHoy, "dddd, DD-MM-YYYY")
    .locale("es")
    .format("MMMM-YYYY");

  // Capitalizar la primera letra
  const fechaFinal =
    fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);

  return (
    <div className="gauge-container">
      <div className="date-info">
        <span>{ViewMode === "ventasDia" && fechaHoy}</span>
        <span>
          {ViewMode === "ventasMes" && rangeInicio + " al " + rangeFin}
        </span>
        <span>{ViewMode === "gastos" && fechaFinal}</span>
      </div>
    </div>
  );
};

export default TopFechasHandling;
