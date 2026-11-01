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

import { es } from "date-fns/locale";
import {
  hoyBogota, fechaDelCalendario, fechaParaCalendario, formatearFecha, rangoMes,
} from "./utils/fechas";

// Vincular el modal al elemento raíz para accesibilidad
Modal.setAppElement("#root");

function App() {
  const [datosVentas, setDatosVentas] = useState(null);
  const ventas = datosVentas?.results || [];
  const ventasAtas = datosVentas?.resultsAnioAtras || [];
  const [gastos, setGastos] = useState([]);
  const [periodo, setPeriodo] = useState("ventasDia");
  const [fechaHoy, setFechaHoy] = useState(hoyBogota);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalIsDiaOpen, setModalIsDiaOpen] = useState(false);
  const [modalIsMesGastoOpen, setModalIsMesGastoOpen] = useState(false);
  const [modalIsReportOpen, setModalIsReportOpen] = useState(false);
  const isSwitchOn = periodo === "ventasMes";
  const viewMode = periodo;
  const value = 0;
  const [rangeInicio, setRangeInicio] = useState(() =>
    moment(hoyBogota(), "YYYY-MM-DD").startOf("month").format("YYYY-MM-DD")
  );
  const [rangeFin, setRangeFin] = useState(() =>
    moment(hoyBogota(), "YYYY-MM-DD").endOf("month").format("YYYY-MM-DD")
  );
  const [range, setRange] = useState(() => [rangoMes(fechaParaCalendario(hoyBogota()))]);
  const [diaBorrador, setDiaBorrador] = useState(fechaHoy);
  const [actualizacion, setActualizacion] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [errorVentas, setErrorVentas] = useState("");
  const servidor = process.env.REACT_APP_URL_PRODUCCION || "localhost:5001";
  const apiUrl = /^https?:\/\//.test(servidor)
    ? servidor.replace(/\/$/, "")
    : `${window.location.protocol === "https:" ? "https" : "http"}://${servidor}`;

  const openReportModal = () => setModalIsReportOpen(true);
  const closeReportModal = () => setModalIsReportOpen(false);
  const closeModal = () => {
    setModalIsOpen(false);
    setModalIsDiaOpen(false);
    setModalIsMesGastoOpen(false);
  };
  const closeDiaModal = closeModal;

  const openModal = () => {
    setDiaBorrador(fechaHoy);
    setRange([{
      startDate: fechaParaCalendario(rangeInicio),
      endDate: fechaParaCalendario(rangeFin),
      key: "selection",
    }]);
    if (value === 1) setModalIsMesGastoOpen(true);
    else if (isSwitchOn) setModalIsOpen(true);
    else setModalIsDiaOpen(true);
  };

  const aplicarFechas = () => {
    if (modalIsOpen) {
      setRangeInicio(fechaDelCalendario(range[0].startDate));
      setRangeFin(fechaDelCalendario(range[0].endDate));
    } else {
      setFechaHoy(diaBorrador);
    }
    closeModal();
  };
  const setSelectedDate = (date) => {
    if (date) setDiaBorrador(fechaDelCalendario(date));
  };
  const setSelectedMes = setSelectedDate;
  const handleSelectRangoFechas = (ranges) => setRange([ranges.selection]);
  const handleSelectPeriodoAux = (seleccion) => setPeriodo(seleccion);

  // El socket solo avisa de cambios. La consulta usa siempre el filtro vigente.
  useEffect(() => {
    const socket = io(apiUrl, { transports: ["websocket"] });
    socket.on("db_change", () => setActualizacion((version) => version + 1));
    return () => socket.disconnect();
  }, [apiUrl]);

  useEffect(() => {
    const controller = new AbortController();
    let vigente = true;
    setCargando(true);
    setErrorVentas("");
    const cargar = async () => {
      try {
        const parametros = [periodo, rangeInicio, rangeFin, fechaHoy]
          .map(encodeURIComponent).join("/");
        const response = await fetch(`${apiUrl}/api/ventas/${parametros}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No se pudieron consultar las ventas.");
        if (!Array.isArray(data.results) || !Array.isArray(data.resultsAnioAtras) || !data.fechas) {
          throw new Error("El servidor devolvió una respuesta de ventas incompleta.");
        }
        if (vigente) setDatosVentas(data);
      } catch (error) {
        if (vigente && error.name !== "AbortError") setErrorVentas(error.message);
      } finally {
        if (vigente) setCargando(false);
      }
    };
    cargar();
    return () => {
      vigente = false;
      controller.abort();
    };
  }, [apiUrl, periodo, rangeInicio, rangeFin, fechaHoy, actualizacion]);

  useEffect(() => {
    const controller = new AbortController();
    const cargar = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/gastos/${encodeURIComponent(fechaHoy)}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data.resultsAux) && !controller.signal.aborted) {
          setGastos(data.resultsAux);
        }
      } catch (error) {
        if (error.name !== "AbortError") console.error("Error al obtener gastos:", error);
      }
    };
    cargar();
    return () => controller.abort();
  }, [apiUrl, fechaHoy, actualizacion]);

  const formatCurrency = (valor) => valor.toLocaleString("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  });
  const fechasConsultadas = datosVentas?.fechas;
  const periodoDeDatos = fechasConsultadas
    ? (periodo === "ventasDia"
      ? formatearFecha(fechasConsultadas.inicio)
      : `${fechasConsultadas.inicio} al ${fechasConsultadas.fin}`)
    : "";

  const renderCalendarToFilter = () => (
    <div className="view-selector">
      <button className="calendar-trigger" aria-label="Filtrar fechas" onClick={openModal}>
        <CalendarMonthIcon />
      </button>
      <button
        className={`selector-btn ${viewMode === "ventasMes" ? "active" : ""}`}
        onClick={() => handleSelectPeriodoAux("ventasMes")}
      >Mes</button>
      <button
        className={`selector-btn ${viewMode === "ventasDia" ? "active" : ""}`}
        onClick={() => handleSelectPeriodoAux("ventasDia")}
      >Día</button>
    </div>
  );

  return (
    <div className="App">
      <div className="header-container">
        {/* Logo y eslogan */}
        <div className="logo-section">
          <img src={logo} alt="Logo" className="logo" />
        </div>

        {/* Sección de fecha y selector */}
        <div className="date-section">
          <button
            aria-label="Ver informe"
            className="assessment-icon calendar-trigger"
            disabled={cargando || !!errorVentas || !datosVentas}
            onClick={openReportModal}
          ><AssessmentOutlinedIcon fontSize="large" /></button>

          <TopFechasHandling
            Opcion={value}
            ViewMode={viewMode}
            fechaHoy={fechaHoy}
            rangeInicio={rangeInicio}
            rangeFin={rangeFin}
            finConsultado={!cargando && !errorVentas ? fechasConsultadas?.fin : undefined}
          />

          {/* Selector Mes/Día */}
          {renderCalendarToFilter()}
        </div>
      </div>

      <div className="container">
        {cargando && <p className="estado-ventas" role="status">Cargando ventas del periodo seleccionado…</p>}
        {errorVentas && <div className="estado-ventas" role="alert">
          <p>{errorVentas}</p>
          <button onClick={() => setActualizacion((version) => version + 1)}>Reintentar</button>
        </div>}
        {!cargando && !errorVentas && ventas.length === 0 &&
          <p className="estado-ventas">No hay ventas en el periodo seleccionado.</p>}
        {value === 0 && !cargando && !errorVentas &&
          // Vista de Ventas
          ventas.map((item) => (
            <SalesBox
              key={item._id}
              datos={item}
              local={item._id}
              ventas={item.total_ventas}
              numeroPedidos={item.total_pedidos}
              maxValor={item.objetivo_ventas}
              currencyFormat={formatCurrency}
              ventasAtras={ventasAtas.find((v) => v._id === item._id)}
              periodoDeDatos={periodoDeDatos}
              diasPeriodo={fechasConsultadas?.dias}
              diasPeriodoAnterior={fechasConsultadas?.diasAnterior}
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
            <h2>Selecciona un mes o rango</h2>
            <CloseIcon onClick={closeModal}>Cerrar</CloseIcon>
          </div>
          <label htmlFor="mes-ventas">Mes completo</label>
          <DatePicker
            id="mes-ventas"
            selected={range[0].startDate}
            onChange={(date) => date && setRange([rangoMes(date)])}
            showMonthYearPicker
            dateFormat="MMMM yyyy"
            locale={es}
            maxDate={fechaParaCalendario(hoyBogota())}
          />
          <DateRangePicker
            locale={es}
            maxDate={fechaParaCalendario(hoyBogota())}
            shownDate={range[0].startDate}
            ranges={range}
            onChange={handleSelectRangoFechas}
            showSelectionPreview={true}
            moveRangeOnFirstSelection={false}
            months={1} // Solo un mes para hacerlo más pequeño
            direction="horizontal"
          />
          <div className="acciones-fechas">
            <button onClick={closeModal}>Cancelar</button>
            <button onClick={aplicarFechas}>Aplicar fechas</button>
          </div>
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
            selected={fechaParaCalendario(diaBorrador)}
            locale={es}
            maxDate={fechaParaCalendario(hoyBogota())}
            onChange={(date) => setSelectedDate(date)}
            inline // Muestra el calendario directamente sin input
            monthsShown={1}
          />
          <div className="acciones-fechas">
            <button onClick={closeModal}>Cancelar</button>
            <button onClick={aplicarFechas}>Aplicar fechas</button>
          </div>
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
            selected={fechaParaCalendario(diaBorrador)}
            locale={es}
            maxDate={fechaParaCalendario(hoyBogota())}
            onChange={(date) => setSelectedMes(date)}
            inline // Muestra el calendario directamente sin input
            showMonthYearPicker
          />
          <button onClick={aplicarFechas}>Aplicar fechas</button>
        </Modal>
      </>

      {datosVentas && !cargando && !errorVentas && (
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
                  mes={fechasConsultadas?.fin.slice(5, 7)}
                  anio={fechasConsultadas?.fin.slice(0, 4)}
                  rangoFechas={periodoDeDatos}
                  rangoAnterior={fechasConsultadas
                    ? `${fechasConsultadas.inicioAnterior} al ${fechasConsultadas.finAnterior}`
                    : ""}
                  results={ventas}
                  resultsAnioAtras={ventasAtas}
                />
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}

export default App;
