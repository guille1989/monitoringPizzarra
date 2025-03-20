const API_URL = process.env.REACT_APP_OPENAI_API_URL;
const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

export const getGPTResponse = async (userMessage, salesData, numeroPedidos, maxValor, ventasAtras) => {
  try {
    const formattedData = JSON.stringify(salesData, null, 2); // Formatea los datos en JSON legible
    console.log("📤 Datos de ventas:", formattedData);

    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Usa gpt-4o-mini para menor costo y rapidez
        messages: [
          { role: "system", content: "Eres un asistente experto en análisis de ventas." },
          { role: "user", content: `Aquí están los datos de ventas: \n${formattedData}\n\n${userMessage}` }
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