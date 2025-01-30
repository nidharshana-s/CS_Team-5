const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { specs, swaggerUi } = require('./config/swagger');
require("dotenv").config();


const app = express();

// Middleware
//app.use(bodyParser.json());
app.use(express.json()); 

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

//Routes
const billRoutes = require("./routes/bills");
app.use("/api", billRoutes);

// Start the server
const PORT = process.env.PORT
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
