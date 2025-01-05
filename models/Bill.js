const mongoose = require('mongoose')
const billSchema = new mongoose.Schema({
    bid : {type:String, required: true},
    pid : {type:String, required:true},
    med: [
        {
          mid: { type: String, required: true }, // Medicine ID (foreign key)
          quantity: { type: Number, required: true }, // Quantity of the medicine
          _id: false,
        },
      ],
    total: { type: Number, required: true }
},{versionKey: false })

const Bill = mongoose.model("Bill", billSchema);
module.exports = Bill;