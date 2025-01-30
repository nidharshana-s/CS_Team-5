const mongoose = require('mongoose')
const billSchema = new mongoose.Schema({
    bid : {type:String, required: true},
    reg_no : {type:String, required : true},
    Timestamp: {type:String, required:true},
    UHID : {type:String, required:true},
    med: [
        {
          mid: { type: String, required: true },
          quantity: { type: Number, required: true }, 
          _id: false,
        },
      ],
    total: { type: Number, required: true }
},{versionKey: false })

const Bill = mongoose.model("Bill", billSchema);
module.exports = Bill;