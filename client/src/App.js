import "./App.css";
import logo from "./assets/pzlogo.svg";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Switch from "@mui/material/Switch";
import moment from "moment-timezone";
import "moment/locale/es";

import SalesBox from "./components/ventas_component/ventas_box_main";

function App() {
  const [dbChange, setDbChange] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [numeroPedido, setNumeroPedido] = useState(0);
  const [periodo, setPeriodo] = useState("ventasDia"); // Estado inicial: "mes"
  const [fechaHoy, setFechaHoy] = useState(
    moment().locale("es").tz("America/Bogota").format("dddd, DD-MM-YYYY")
  );

  const handleSelectPeriodo = (event) => {
    const nuevoPeriodo = event.target.checked ? "ventasDia" : "ventasMes";
    const fechaTitulos =
      nuevoPeriodo === "ventasDia"
        ? moment().locale("es").tz("America/Bogota").format("dddd, DD-MM-YYYY")
        : moment().locale("es").tz("America/Bogota").format("MMMM, MM-YYYY");

    console.log("🔄 Cambiando periodo a:", nuevoPeriodo);
    fetchVentas(nuevoPeriodo);
    setPeriodo(nuevoPeriodo);
    setFechaHoy(fechaTitulos);
    return nuevoPeriodo; // Si necesitas retornarlo para otra lógica
  };

  useEffect(() => {
    fetchVentas(periodo);
    const socket = io(`ws://${process.env.REACT_APP_URL_PRODUCCION}`, {
      transports: ["websocket"],
    });
    socket.on("connect", () => {
      console.log("✅ Conectado a WebSocket");
    });
    socket.on("db_change", (data) => {
      console.log("📩 Cambio detectado en la DB:", data);
      setDbChange(data);
      fetchVentas(periodo);
    });
    socket.on("db_status", (status) => {
      console.log("📢 Estado de la DB:", status);
    });
    socket.on("disconnect", () => console.log("🔴 WebSocket desconectado"));
    socket.on("connect_error", (err) =>
      console.error("❌ Error en la conexión:", err)
    );
    return () => {
      socket.disconnect();
    };
  }, []);

  // Función para formatear el valor como dinero
  const formatCurrency = (value) => {
    return value.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Función para obtener los datos de ventas desde el backend
  const fetchVentas = async (periodo) => {
    try {
      const response = await fetch(
        `http://${process.env.REACT_APP_URL_PRODUCCION}/api/ventas/${periodo}`
      );
      const data = await response.json();
      console.log("📤 Ventas:", data);
      setVentas(data);
    } catch (error) {
      console.error("Error al obtener ventas:", error);
    }
  };

  const label = { inputProps: { "aria-label": "Switch demo" } };

  return (
    <div className="App">
      <div>
        <img src={logo} alt="Logo" className="logo" />
        <div className="fecha_hoy_inicio_container">
          {/*Fecha hoy*/}
          <h2 className="fecha_hoy_inicio">{fechaHoy}</h2>
        </div>
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
      <div className="container">
        {ventas.map((item, index) => (
          <SalesBox
            key={index}
            datos={item}
            local={item._id}
            ventas={item.total_ventas}
            numeroPedidos={item.total_pedidos}
            maxValor={item.objetivo_ventas} // Puedes cambiar este valor si es necesario
            currencyFormat={formatCurrency} // Pasa tu función formatCurrency si es necesario
          />
        ))}
      </div>
    </div>
  );
}

export default App;
