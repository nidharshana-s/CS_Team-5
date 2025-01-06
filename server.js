const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { specs, swaggerUi } = require('./config/swagger');

const app = express();

// Middleware
//app.use(bodyParser.json());
app.use(express.json()); 

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// MongoDB connection
mongoose
  .connect("mongodb+srv://CS_HOSPITALS:Gq1ixBRGVMb8BdH7@cluster0.tt3fg.mongodb.net/hospital?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

//Routes
const billRoutes = require("./routes/bills");
app.use("/api", billRoutes);

// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
