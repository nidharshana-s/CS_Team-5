const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { specs, swaggerUi } = require('./config/swagger');
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
  .connect("mongodb+srv://CS_HOSPITALS:Gq1ixBRGVMb8BdH7@cluster0.tt3fg.mongodb.net/hospital?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

const billRoutes = require("./routes/bills");
app.use("/api", billRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
