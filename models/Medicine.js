const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  mid: { type: String, required: true }, // Medicine ID
  name: { type: String, required: true }, // Medicine Name
  price: { type: Number, required: true }, // Medicine Price
});

const Medicine = mongoose.model("Medicine", medicineSchema);

module.exports = Medicine;
