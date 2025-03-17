import "./App.css";
import logo from "./assets/pzlogo.svg";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Switch from "@mui/material/Switch";
import moment from "moment-timezone";
import "moment/locale/es";
import Box from "@mui/material/Box";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import CloseIcon from "@mui/icons-material/Close";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import Typography from "@mui/material/Typography";
import Modal from "react-modal";

import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

import SalesBox from "./components/ventas_component/ventas_box_main";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

// Vincular el modal al elemento raíz para accesibilidad
Modal.setAppElement("#root");

function App() {
  const [dbChange, setDbChange] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [numeroPedido, setNumeroPedido] = useState(0);
  const [periodo, setPeriodo] = useState("ventasDia"); // Estado inicial: "mes"
  const [fechaHoy, setFechaHoy] = useState(
    moment().locale("es").tz("America/Bogota").format("dddd, DD-MM-YYYY")
  );
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isSwitchOn, setIsSwitchOn] = useState(false); // Estado del Switch
  const [selectedOption, setSelectedOption] = useState("Ventas");
  const [open, setOpen] = useState(false);
  const openModal = () => {
    if (isSwitchOn) {
      // Solo abre si el Switch está activado
      setModalIsOpen(true);
    }
  };
  const closeModal = () => {
    const fechaTitulos = moment(rangeInicio)
            .locale("es")
            .tz("America/Bogota")
            .format("dddd, DD-MM-YYYY") +
          "  al  " +
          moment(rangeFin)
            .locale("es")
            .tz("America/Bogota")
            .format("dddd, DD-MM-YYYY");

    setFechaHoy(fechaTitulos);
    fetchVentas(periodo);
    setModalIsOpen(false);
  };
  const [range, setRange] = useState([
    {
      startDate: new Date(), // Fecha inicial: hoy
      endDate: new Date(), // Fecha final: hoy
      key: "selection", // Clave requerida por la librería
    },
  ]);
  const [rangeInicio, setRangeInicio] = useState(
    moment().clone().startOf("month").format("YYYY-MM-DD")
  );
  const [rangeFin, setRangeFin] = useState(
    moment().clone().endOf("month").format("YYYY-MM-DD")
  );

  const handleSelectRangoFechas = (ranges) => {
    setRange([ranges.selection]);
    setRangeInicio(
      moment(ranges.selection.startDate)
        .tz("America/Bogota")
        .format("YYYY-MM-DD")
    );
    setRangeFin(
      moment(ranges.selection.endDate).tz("America/Bogota").format("YYYY-MM-DD")
    );
    console.log("Rango seleccionado:", {
      startDate: moment(ranges.selection.startDate)
        .tz("America/Bogota")
        .format("YYYY-MM-DD"),
      endDate: moment(ranges.selection.endDate)
        .tz("America/Bogota")
        .format("YYYY-MM-DD"),
    });
  };

  const handleSelectPeriodo = (event) => {
    const nuevoPeriodo = event.target.checked ? "ventasDia" : "ventasMes";
    const fechaTitulos =
      nuevoPeriodo === "ventasDia"
        ? moment().locale("es").tz("America/Bogota").format("dddd, DD-MM-YYYY")
        : moment(rangeInicio)
            .locale("es")
            .tz("America/Bogota")
            .format("dddd, DD-MM-YYYY") +
          " al " +
          moment(rangeFin)
            .locale("es")
            .tz("America/Bogota")
            .format("dddd, DD-MM-YYYY");

    console.log("🔄 Cambiando periodo a:", nuevoPeriodo);

    if (nuevoPeriodo === "ventasDia") {
      setIsSwitchOn(false);
    } else {
      setIsSwitchOn(true);
    }

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
        `http://${process.env.REACT_APP_URL_PRODUCCION}/api/ventas/${periodo}/${rangeInicio}/${rangeFin}`
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
          <div style={{ display: "flex", gap: "5px" }}>
            {isSwitchOn && (
              <CalendarMonthIcon
                style={{ marginRight: "10px", cursor: "pointer" }}
                onClick={openModal}
              />
            )}
            <div>Mes</div>
            <Switch
              {...label}
              checked={periodo === "ventasDia"} // Controla el estado del Switch
              onChange={handleSelectPeriodo}
              color="default"
            />
            <div>dia</div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginLeft: "20px",
            }}
          ></div>
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

      <>
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          className="modal"
          overlayClassName="overlay"
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h2>Selecciona un rango</h2>
            <CloseIcon onClick={closeModal}>Cerrar</CloseIcon>
          </div>
          <DateRangePicker
            ranges={range}
            onChange={handleSelectRangoFechas}
            showSelectionPreview={true}
            moveRangeOnFirstSelection={false}
            months={1} // Solo un mes para hacerlo más pequeño
            direction="horizontal"
          />
        </Modal>
      </>
    </div>
  );
}

export default App;
