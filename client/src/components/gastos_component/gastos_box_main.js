import React, { useEffect, useState } from "react";
import { Chart } from "react-google-charts";
import "./gastos_box_main.css"; // Asegúrate de tener el CSS correcto para los estilos

const GastosBoxMain = ({
  local,
  title,
  periodo,
  gastosTotales,
  gastosParseados,
}) => {
  useEffect(() => {
    console.log("Total Gasto:", gastosTotales);
    console.log("Gastos Parseados:", gastosParseados);
  }, []);

  const options = {
    pieHole: 0.4,
    is3D: false,
    legend: {
      position: "labeled",
      textStyle: {
        color: "#fff",
        fontSize: 9,
      },
    },
    backgroundColor: "transparent",
    chartArea: { left: 0, right: 10, top: 7, width: "100%", height: "90%" },
  };

  // No renderizar el gauge si maxValorg es 0
  if (gastosTotales === undefined) {
    return <div>Cargando...</div>; // O un spinner, o nada
  }

  return (
    <div>
      {/* Aquí puedes agregar más contenido o componentes relacionados con los gastos */}
      <div className="box_title_main">
        <div style={{ width: "50%" }}>{title || (local ? local : "-")}</div>
      </div>

      <div className="box">
        <div className="box_gastos">
          <div className="box_gastos_title_value">
            <div className="box_gastos_text">Gasto Total:</div>
            <div className="box_gastos_value">
              {gastosTotales.toLocaleString("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </div>
          </div>

          <div className="box_pie_gastos">
            <Chart
              chartType="PieChart"
              width="300px"
              height="150px"
              data={gastosParseados}
              options={options}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GastosBoxMain;
