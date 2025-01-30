const mongoose = require('mongoose')
const billSchema = new mongoose.Schema({
    bid : {type:String, required: true},
    UHID : {type:String, required:true},
    reg_no : {type:String, required : true},
    //Timestamp: {type:String, required:true},
    
    med: [
        {
          mid: { type: String, required: true }, // Medicine ID (foreign key)
          quantity: { type: Number, required: true }, // Quantity of the medicine
          _id: false,
        },
      ],
    total: { type: Number, required: true },
    Date: {type:Date, required:true},
},{versionKey: false })

const Bill = mongoose.model("Bill", billSchema);
module.exports = Bill;