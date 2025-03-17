import { useEffect, useState } from "react";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Switch from "@mui/material/Switch";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    ochre: {
      main: "#E3D026",
      light: "#E9DB5D",
      dark: "#A29415",
      contrastText: "#242105",
    },
  },
});

const VentasFiltros = (props) => {
  const [periodo, setPeriodo] = useState("ventasDia"); // Estado inicial: "mes"

  const label = { inputProps: { "aria-label": "Switch demo" } };

  const handleSelectPeriodo = (event) => {
    const nuevoPeriodo = event.target.checked ? "ventasDia" : "ventasMes";
    console.log("🔄 Cambiando periodo a:", nuevoPeriodo);
    setPeriodo(nuevoPeriodo);
    return nuevoPeriodo; // Si necesitas retornarlo para otra lógica
  };

  return (
    <div className="ventas_box_filtros">
      <div className="ventas_box_select_mes_dia">
        <div>
          <div>Mes</div>
          <Switch
            {...label}
            checked={periodo === "ventasDia"} // Controla el estado del Switch
            onChange={handleSelectPeriodo}
            color="default"
          />
          <div>dia</div>
        </div>
        <div>
          
        </div>
      </div>
    </div>
  );
};

export default VentasFiltros;
