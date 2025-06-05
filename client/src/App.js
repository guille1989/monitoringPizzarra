import "./App.css";
import logo from "./assets/pzlogo.svg";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import moment from "moment-timezone";
import "moment/locale/es";
import CloseIcon from "@mui/icons-material/Close";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import Modal from "react-modal";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";

import { DateRangePicker } from "react-date-range";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

import SalesBox from "./components/ventas_component/ventas_box_main";
import GastosBoxMain from "./components/gastos_component/gastos_box_main";
import MonthlySalesReport from "./components/report_component/report";
import TopFechasHandling from "./components/top_fecha_select/topFechaSelect";

import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import BalanceIcon from "@mui/icons-material/Balance";
import Paper from "@mui/material/Paper";

// Vincular el modal al elemento raíz para accesibilidad
Modal.setAppElement("#root");

function App() {
  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [ventasAtas, setVentasAtras] = useState([]);
  const [periodo, setPeriodo] = useState("ventasDia"); // Estado inicial: "mes"
  const [fechaHoy, setFechaHoy] = useState(
    moment().locale("es").tz("America/Bogota").format("dddd, DD-MM-YYYY")
  );
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalIsDiaOpen, setModalIsDiaOpen] = useState(false);
  const [modalIsMesGastoOpen, setModalIsMesGastoOpen] = useState(false);
  const [modalIsReportOpen, setModalIsReportOpen] = useState(false);
  const [isSwitchOn, setIsSwitchOn] = useState(false); // Estado del Switch
  const [viewMode, setViewMode] = useState("ventasDia");
  const [value, setValue] = useState(0);
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

  const openReportModal = () => {
    setModalIsReportOpen(true);
  };

  const openModal = () => {
    if (value === 1) {
      setModalIsMesGastoOpen(true);
    }

    if (isSwitchOn) {
      // Solo abre si el Switch está activado
      setModalIsOpen(true);
    } else {
      setModalIsDiaOpen(true);
    }
  };

  const closeDiaModal = () => {
    fetchVentas(periodo);
    fetchGastos(periodo);
    setModalIsOpen(false);
    setModalIsDiaOpen(false);
    setModalIsMesGastoOpen(false);
  };

  const closeReportModal = () => {
    setModalIsReportOpen(false);
  };

  const closeModal = () => {
    fetchVentas(periodo);
    fetchGastos(periodo);
    setModalIsOpen(false);
    setModalIsDiaOpen(false);
    setModalIsMesGastoOpen(false);
  };

  const setSelectedDate = (date) => {
    setFechaHoy(
      moment(date).locale("es").tz("America/Bogota").format("dddd DD-MM-YYYY")
    );
    console.log(
      "Fecha seleccionada:",
      moment(date).locale("es").tz("America/Bogota").format("dddd, DD-MM-YYYY")
    );
  };

  const setSelectedMes = (date) => {
    const fechaFormateada = moment(date).locale("es").format("MMMM-YYYY");

    // Capitalizar la primera letra
    const fechaFinal =
      fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);

    setFechaHoy(
      moment(date).locale("es").tz("America/Bogota").format("dddd DD-MM-YYYY")
    );

    console.log("Fecha formateada:", fechaFinal);
  };

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

  const handleSelectPeriodoAux = (periodoSeleccionado) => {
    console.log("🔄 Cambiando periodo a:", periodoSeleccionado);

    if (periodoSeleccionado === "ventasDia") {
      setViewMode("ventasDia");
      setIsSwitchOn(false);
    } else {
      setViewMode("ventasMes");
      setIsSwitchOn(true);
    }

    fetchVentas(periodoSeleccionado);
    setPeriodo(periodoSeleccionado);
    return periodoSeleccionado; // Si necesitas retornarlo para otra lógica
  };

  useEffect(() => {
    fetchVentas(periodo);
    fetchGastos(periodo);
    const socket = io(`ws://${process.env.REACT_APP_URL_PRODUCCION}`, {
      transports: ["websocket"],
    });
    socket.on("connect", () => {
      console.log("✅ Conectado a WebSocket");
    });
    socket.on("db_change", (data) => {
      console.log("📩 Cambio detectado en la DB:", data);
      fetchVentas(periodo);
      fetchGastos(periodo);
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
        `http://${process.env.REACT_APP_URL_PRODUCCION}/api/ventas/${periodo}/${rangeInicio}/${rangeFin}/${fechaHoy}`
      );
      const data = await response.json();
      console.log("📤 Ventas:", data);
      setVentas(data.results);
      setVentasAtras(data.resultsAnioAtras);
    } catch (error) {
      console.error("Error al obtener ventas:", error);
    }
  };

  const fetchGastos = async (periodo) => {
    try {
      const response = await fetch(
        `http://${process.env.REACT_APP_URL_PRODUCCION}/api/gastos/${fechaHoy}`
      );
      const data = await response.json();
      console.log("📤 Gastos:", data);
      setGastos(data.resultsAux);
    } catch (error) {
      console.error("Error al obtener gastos:", error);
    }
  };

  const renderCalendarToFilter = () => {
    if (value === 0) {
      return (
        <div className="view-selector">
          {isSwitchOn && (
            <CalendarMonthIcon
              style={{ marginRight: "15px", cursor: "pointer" }}
              onClick={openModal}
            />
          )}

          <button
            className={`selector-btn ${
              viewMode === "ventasMes" ? "active" : ""
            }`}
            onClick={() => handleSelectPeriodoAux("ventasMes")}
          >
            Mes
          </button>
          <button
            className={`selector-btn ${
              viewMode === "ventasDia" ? "active" : ""
            }`}
            onClick={() => handleSelectPeriodoAux("ventasDia")}
          >
            Día
          </button>

          {!isSwitchOn && (
            <CalendarMonthIcon
              style={{ marginLeft: "15px", cursor: "pointer" }}
              onClick={openModal}
            />
          )}
        </div>
      );
    } else if (value === 1) {
      return (
        <div className="view-selector">
          <CalendarMonthIcon
            style={{ marginLeft: "0px", cursor: "pointer" }}
            onClick={openModal}
          />
        </div>
      );
    } else if (value === 2) {
    }
  };

  return (
    <div className="App">
      <div className="header-container">
        {/* Logo y eslogan */}
        <div className="logo-section">
          <img src={logo} alt="Logo" className="logo" />
        </div>

        {/* Sección de fecha y selector */}
        <div className="date-section">
          <AssessmentOutlinedIcon
            onClick={openReportModal}
            fontSize="large"
            className="assessment-icon"
          />

          <TopFechasHandling
            Opcion={value}
            ViewMode={viewMode}
            fechaHoy={fechaHoy}
            rangeInicio={rangeInicio}
            rangeFin={rangeFin}
          />

          {/* Selector Mes/Día */}
          {renderCalendarToFilter()}
        </div>
      </div>

      <div className="container">
        {value === 0 &&
          // Vista de Ventas
          ventas.map((item, index) => (
            <SalesBox
              key={index}
              datos={item}
              local={item._id}
              ventas={item.total_ventas}
              numeroPedidos={item.total_pedidos}
              maxValor={item.objetivo_ventas}
              currencyFormat={formatCurrency}
              ventasAtras={ventasAtas.find((v) => v._id === item._id)}
              periodoDeDatos={
                periodo === "ventasDia"
                  ? moment()
                      .locale("es")
                      .tz("America/Bogota")
                      .format("dddd, DD-MM-YYYY")
                  : rangeInicio + " al " + rangeFin
              }
              periodoDeDatosAux={periodo}
            />
          ))}
        {value === 1 &&
          gastos.map((item, index) => (
            // Vista de Gastos
            <div>
              {/* Aquí puedes renderizar tu componente o contenido de gastos */}
              <GastosBoxMain
                local={item.local}
                periodo={fechaHoy}
                gastosTotales={item.totalGasto}
                gastosParseados={item.gastosParseados}
              />
              {/* <GastosBox ... /> */}
            </div>
          ))}
        {value === 2 && (
          // Vista de Resumen
          <div>
            {/* Aquí puedes renderizar tu componente o contenido de resumen */}
            <h2>Resumen</h2>
            {/* <ResumenBox ... /> */}
          </div>
        )}
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

      <>
        <Modal
          isOpen={modalIsDiaOpen}
          onRequestClose={closeDiaModal}
          className="modal"
          overlayClassName="overlay"
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h2>Selecciona un dia</h2>
            <CloseIcon onClick={closeDiaModal}>Cerrar</CloseIcon>
          </div>
          <DatePicker
            selected={moment(fechaHoy, "dddd, DD-MM-YYYY", "es").toDate()}
            onChange={(date) => setSelectedDate(date)}
            inline // Muestra el calendario directamente sin input
            monthsShown={1} // Muestra solo un mes
          />
        </Modal>
      </>

      <>
        <Modal
          isOpen={modalIsMesGastoOpen}
          onRequestClose={closeModal}
          className="modal"
          overlayClassName="overlay"
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h2>Selecciona un mes</h2>
            <CloseIcon onClick={closeDiaModal}>Cerrar</CloseIcon>
          </div>
          <DatePicker
            selected={moment(fechaHoy, "dddd, DD-MM-YYYY", "es").toDate()}
            onChange={(date) => setSelectedMes(date)}
            inline // Muestra el calendario directamente sin input
            showMonthYearPicker // <-- Esta es la clave
          />
        </Modal>
      </>

      {ventas && ventasAtas && (
        <>
          <Modal
            isOpen={modalIsReportOpen}
            onRequestClose={closeReportModal}
            className="modal-fullscreen"
            overlayClassName="overlay-fullscreen"
          >
            <div>
              <div>
                <CloseIcon
                  onClick={closeReportModal}
                  style={{ cursor: "pointer" }}
                >
                  Cerrar
                </CloseIcon>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <MonthlySalesReport
                  mes={
                    periodo === "ventasMes"
                      ? rangeFin.split("-")[1]
                      : fechaHoy.split("-")[1]
                  }
                  anio={
                    periodo === "ventasMes"
                      ? rangeFin.split("-")[0]
                      : fechaHoy.split("-")[0]
                  }
                  rangoFechas={
                    periodo === "ventasMes"
                      ? rangeInicio + " al " + rangeFin
                      : fechaHoy
                  }
                  results={ventas}
                  resultsAnioAtras={ventasAtas}
                />
              </div>
            </div>
          </Modal>
        </>
      )}

      <Paper
        sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
        elevation={3}
      >
        <BottomNavigation
          showLabels
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue);
            console.log("Valor seleccionado:", newValue);
            setViewMode(
              newValue === 0
                ? "ventasDia"
                : newValue === 1
                ? "gastos"
                : "resumen"
            );
          }}
        >
          <BottomNavigationAction
            label="Ventas"
            icon={<MonetizationOnIcon />}
          />
          <BottomNavigationAction label="Gastos" icon={<PointOfSaleIcon />} />
          <BottomNavigationAction label="Resumen" icon={<BalanceIcon />} />
        </BottomNavigation>
      </Paper>
    </div>
  );
}

export default App;
