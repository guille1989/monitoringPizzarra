import "./App.css";
import logo from "./assets/pzlogo.svg";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Switch from '@mui/material/Switch';

import SalesBox from "./components/ventas_box_main"; 

function App() {
  const [dbChange, setDbChange] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [numeroPedido, setNumeroPedido] = useState(0);
  

  useEffect(() => {
    fetchVentas();

    const socket = io(`ws://${process.env.REACT_APP_URL_PRODUCCION}`, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("✅ Conectado a WebSocket");
    });

    socket.on("db_change", (data) => {
      console.log("📩 Cambio detectado en la DB:", data);
      setDbChange(data);
      fetchVentas();
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
  const fetchVentas = async () => {
    try {
      const response = await fetch(
        `http://${process.env.REACT_APP_URL_PRODUCCION}/api/ventas`
      );
      const data = await response.json();
      console.log("📤 Ventas:", data);
      setVentas(data);
    } catch (error) {
      console.error("Error al obtener ventas:", error);
    }
  };

  return (
    <div className="App">
      <>
        <img src={logo} alt="Logo" className="logo" />
      </>
      <div className="container">
        {ventas.map((item, index) => (
          <SalesBox
            key={index}
            datos={item}
            local={item._id}
            ventas={item.total_ventas}
            numeroPedidos={item.total_pedidos}
            maxValor={1000000} // Puedes cambiar este valor si es necesario
            currencyFormat={formatCurrency} // Pasa tu función formatCurrency si es necesario
          />
        ))}
      </div>
    </div>
  );
}

export default App;
