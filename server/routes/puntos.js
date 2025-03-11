const Express = require('express');
const rute = Express();
const PuntosPizzarra = require("../models/puntos_modelo");
const moment = require("moment-timezone");


// Ruta GET para ejecutar la agregación
rute.get("/puntos", async (req, res) => {
    //Get para traer todos los puntos
    try {
        const results = await PuntosPizzarra.find();
        res.json(results);
    } catch (error) {
        console.error("Error al obtener puntos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = rute;