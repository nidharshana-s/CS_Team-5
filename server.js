const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { specs, swaggerUi } = require('./config/swagger');
require("dotenv").config();

const cors = require("cors");
const app = express();

const corsOptions = {
  origin: "*",
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type",
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json()); 

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

const billRoutes = require("./routes/bills");
app.use("/api", billRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
