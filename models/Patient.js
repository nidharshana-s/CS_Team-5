const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
    firstName : {type:String, required:true},
    lastName : {type:String, required:true},
    UHID : {type:String, required:true},
    age : {type:Number, required:true},
    totalAppointments : {type:String, required:true},
    lastVisit : {type:Date},
})

const Patient = mongoose.model("Patient", patientSchema);

module.exports = Patient;