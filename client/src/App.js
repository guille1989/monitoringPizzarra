import "./App.css";
import logo from "./assets/pzlogo.svg";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import VentasGauge from "./components/ventas_gauge";

function App() {
  const [dbChange, setDbChange] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [numeroPedido, setNumeroPedido] = useState(0);

  useEffect(() => {
    fetchVentas();
    fetchNumeroPedidos();
    const socket = io(`ws://${process.env.REACT_APP_URL_PRODUCCION}`, {
      transports: ["websocket"]
    });
    
    socket.on("connect", () => console.log("✅ Conectado al WebSocket"));
    //socket.on("db_change", (data) => console.log("📩 Cambio detectado en la DB:", data));
    //socket.on("db_status", (status) => console.log("📢 Estado de la DB:", status));
    socket.on("disconnect", () => console.log("🔴 WebSocket desconectado"));
    socket.on("connect_error", (err) => console.error("❌ Error en la conexión:", err));
    

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
        {/* Elemento arriba del .box */}
        <div className="box">
          <div className="box_ventas">
            <div>
              <div className="box_venatas_text">Numero de pedidos:</div>
              <div>{numeroPedido[0] ? numeroPedido[0].total_pedidos : ""}</div>
            </div>
            <div>
              <div className="box_venatas_text">Ventas Totales:</div>
              <div>
                {ventas[0] ? formatCurrency(ventas[0].total_ventas) : ""}
              </div>
            </div>
          </div>
          <div className="box_ventas_gauge">
            <VentasGauge
              valor={ventas[0] ? ventas[0].total_ventas : 0}
              maxValor={800000}
            />
          </div>
        </div>
        <div className="box">
          <div className="box_ventas">
            <div>
              <div className="box_venatas_text">Numero de pedidos:</div>
              <div>{numeroPedido[1] ? numeroPedido[1].total_pedidos : ""}</div>
            </div>
            <div>
              <div className="box_venatas_text">Ventas Totales:</div>
              <div>
                {ventas[1] ? formatCurrency(ventas[1].total_ventas) : ""}
              </div>
            </div>
          </div>
          <div className="box_ventas_gauge">
            <VentasGauge
              valor={ventas[1] ? ventas[1].total_ventas : 0}
              maxValor={2500000}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
