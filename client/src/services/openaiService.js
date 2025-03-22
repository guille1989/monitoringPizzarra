const API_URL = process.env.REACT_APP_OPENAI_API_URL;
const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

export const getGPTResponse = async (
  userMessage,
  salesData,
  numeroPedidos,
  maxValor,
  ventasAtras,
  periodoDeDatos,
  periodoDeDatosAux
) => {
  try {
    const formattedDatasalesData = JSON.stringify(salesData, null, 2); // Formatea los datos en JSON legible
    const fomratterDatanumeroPedidos = JSON.stringify(numeroPedidos, null, 2); // Formatea los datos en JSON legible
    const fomratterDatamaxValor = JSON.stringify(maxValor, null, 2); // Formatea los datos en JSON legible
    const fomratterDataventasAtras = JSON.stringify(ventasAtras, null, 2); // Formatea los datos en JSON legible
    const fomratterDataperiodoDeDatosAux = JSON.stringify(
      periodoDeDatosAux,
      null,
      2
    );
    const fomratterDataperiodoDeDatos = JSON.stringify(periodoDeDatos, null, 2);

    const messageToOpenAI = `
    Analiza los siguientes datos de ventas de una pizzería:
    - Ventas actuales: ${formattedDatasalesData}
    - Número de pedidos: ${fomratterDatanumeroPedidos}
    - Meta estimada de ventas: ${fomratterDatamaxValor}
    - Ventas del mismo periodo del año pasado: ${fomratterDataventasAtras}
    - Periodo de los datos (especifica si es un día o un mes): ${fomratterDataperiodoDeDatosAux}
    - Periodo de los datos (especifica fecha y hora): ${fomratterDataperiodoDeDatos}`;
    console.log(messageToOpenAI);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Usa gpt-4o-mini para menor costo y rapidez
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente experto en estrategias de ventas para restaurantes y pizzerías.",
          },
          {
            role: "user",
            content: messageToOpenAI,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error("Error al obtener la respuesta");

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error en la solicitud:", error);
    return "Hubo un error al obtener la respuesta.";
  }
};
