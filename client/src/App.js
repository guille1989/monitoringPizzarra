import "./App.css";
import logo from "./assets/pzlogo.svg";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import VentasGauge from "./components/ventas_gauge";

import SalesBox from "./components/ventas_box_main";

function App() {
  const [dbChange, setDbChange] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [numeroPedido, setNumeroPedido] = useState(0);

  useEffect(() => {
    fetchVentas();
    fetchNumeroPedidos();
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
      fetchNumeroPedidos();
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

  // Función para obtener los datos de numero de pedidos desde el backend
  const fetchNumeroPedidos = async () => {
    try {
      const response = await fetch(
        `http://${process.env.REACT_APP_URL_PRODUCCION}/api/numero-pedidos`
      );
      const data = await response.json();
      console.log("📤 Numero Pedidos:", data);
      setNumeroPedido(data);
    } catch (error) {
      console.error("Error al obtener ventas:", error);
    }
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

  return (
    <div className="App">
      <>
        <img src={logo} alt="Logo" className="logo" />
      </>
      <div className="container">
        {[
          { pedido: numeroPedido[0], venta: ventas[0], maxValor: 2500000 },
          { pedido: numeroPedido[1], venta: ventas[1], maxValor: 800000 }
        ].map((item, index) => (
          <SalesBox
            key={index}
            pedido={item.pedido}
            venta={item.venta}
            maxValor={item.maxValor}
            currencyFormat={formatCurrency} // Pasa tu función formatCurrency si es necesario
          />
        ))}
      </div>
    </div>
  );
}

export default App;
