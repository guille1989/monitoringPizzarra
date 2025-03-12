import React, { useEffect } from "react";
import GaugeComponent from "react-gauge-component";

const VentasGauge = ({ valor, maxValor }) => {

  const scaleFactor = maxValor / 100; // Cada unidad del gauge = $8,000
  const moneyValue = valor; // Valor actual en dinero ($600K)
  const gaugeValue = moneyValue / scaleFactor; // Convertir a escala del gauge (75)

  // No renderizar el gauge si maxValorg es 0
  if (maxValor === 0) {
    return <div>Cargando...</div>; // O un spinner, o nada
  }

  return (
    <GaugeComponent
      key={maxValor}
      type="semicircle"
      pointer={{ type: "needle", elastic: true, color: "#1f293d" }}
      arc={{
        width: 0.3,
        subArcs: [
          { limit: 50, color: "#EA4228" }, // $160K
          { limit: 80, color: "#F5CD19" }, // $400K
          { limit: 100, color: "#5BE12C" }, // $800K
        ],
      }}
      value={gaugeValue} // Valor en escala del gauge (75 = $600K)
      labels={{
        valueLabel: {
          formatTextValue: (value) => {
            const money = value * scaleFactor;
            if (money >= 1000000) {
              return `$${(money / 1000000).toFixed(1)}M`;
            }
            return `$${Math.round(money / 1000)}K`;
          },
          style: {
            fontSize: "25px", // Tamaño del texto (ajustable)
            textAnchor: "middle", // Centrado horizontalmente
            fill: "#ffffff", // Color del texto
          },
        },
        tickLabels: {
          ticks: [
            { value: 0 },
            { value: 20 },
            { value: 40 },
            { value: 60 },
            { value: 80 },
            { value: 100 },
          ],
          defaultTickValueConfig: {
            formatTextValue: (value) => {
              const money = value * scaleFactor;
              if (money >= 1000000) {
                // si es mayor a 1000, retornar con 1 decimal
                return `$${(money / 1000000).toFixed(1)}M`;
              }
              return `$${Math.round(money / 1000)}K`;
            },
          },
        },
      }}
    />
  );
};

export default VentasGauge;
