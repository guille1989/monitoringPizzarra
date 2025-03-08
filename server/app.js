const express = require("express");
const { MongoClient } = require("mongodb");
const mongose = require("mongoose");
const http = require("http");
const cors = require("cors"); // Importa CORS
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }, // Permitir conexiones desde cualquier origen (ajusta en producción)
});
const port = 5001;

const uri =
  "mongodb+srv://root:123@cluster0.jwxt0.mongodb.net/inventarios_prod?retryWrites=true&w=majority"; // URI de MongoDB
const client = new MongoClient(uri);

//Rutas:
const ventasRoutes = require("./routes/ventas");

//Conectamos con Data Base
mongose
  .connect(
    "mongodb+srv://root:123@cluster0.jwxt0.mongodb.net/inventarios_prod?retryWrites=true&w=majority",
    {}
  )
  .then(() => console.log("Conectado con DB"))
  .catch(() => console.log("No se puedo conectar con DB"));

mongose.set("strictQuery", true);
//*************************

app.use(cors()); // Habilita CORS para todas las rutas

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("¡Conexión exitosa a MongoDB!");

    const database = client.db("inventarios_prod");
    const collection = database.collection("pedidos");

    // Verificar con un ping
    await database.command({ ping: 1 });
    console.log("Ping exitoso, base de datos activa.");

    return { database, collection };
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error);
    throw error;
  }
}

async function setupWebSocket() {
  try {
    const { collection } = await connectToDatabase();
    io.emit("db_status", { status: "success", message: "Conectado a MongoDB" });

    const changeStream = collection.watch();
    changeStream.on("change", async (change) => {
      if (change.operationType === "insert") {
        // Solo procesar inserts
        const doc = change.fullDocument; // El documento insertado
        // Extraer la información solicitada
        const info = {
          tipo_pedido:
            Array.isArray(doc.aux) && doc.aux.length > 0
              ? doc.aux[0].tipo_pedido
              : "No definido",
          costo_pedido:
            Array.isArray(doc.aux) && doc.aux.length > 0
              ? doc.aux[0].costo_pedido
              : 0,
          costo_domicilio:
            Array.isArray(doc.aux) &&
            doc.aux.length > 0 &&
            doc.aux[0].tipo_pedido === "DOMICILIO"
              ? doc.aux[0].domi_costo || 0
              : null,
          tipos_pedido: Array.isArray(doc.pedido)
            ? doc.pedido.map((item) => item.tipo)
            : [],
        };

        // Enviar al frontend vía WebSocket
        io.emit("db_change", info);
      }
    });
  } catch (error) {
    io.emit("db_status", {
      status: "error",
      message: "Fallo al conectar a MongoDB",
    });
  }
}

// Escuchar conexiones WebSocket
io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

// Rutas
app.use("/api", ventasRoutes);

// Iniciar el servidor
server.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
  setupWebSocket(); // Iniciar conexión a la base de datos y WebSocket
});
