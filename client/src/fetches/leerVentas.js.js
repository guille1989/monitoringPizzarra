// api/ventas.js
const leerVentas = async (periodo) => {
  console.log("🔄 FetchVentas");
  try {
    const response = await fetch(
      `http://${process.env.REACT_APP_URL_PRODUCCION}/api/ventas/${periodo}`
    );
    if (!response.ok) {
      throw new Error("Error al obtener ventas");
    }
    const data = await response.json();
    console.log("📤 Ventas:", data);
    return data;
  } catch (error) {
    console.error("❌ Error al obtener ventas:", error);
    return null; // Retorna null en caso de error
  }
};

export default leerVentas;