const express = require('express')
const Bill = require("../models/Bill")
const Medicine = require("../models/Medicine")
const Patient = require("../models/Patient")
const mongoose = require('mongoose');

const router = express.Router()


router.post("/createbill", async (req, res) => {
    try {
      // Extract medicines from the request body
      const { pid , med } = req.body;
      //const {patient} = req.body.pid;
      const UHID = pid;
      if (!UHID) {
        return res.status(400).json({ error: 'Patient ID (pid) is required' });
      }
      const patient = await mongoose.connection.db.collection('patients').findOne({ UHID });
        if (!patient) {
            return res.status(404).json({ error: `Patient with ID ${UHID} not found` });
        }
      
      console.log(med)
      console.log(patient)
      if (!med || !Array.isArray(med)) {
        return res.status(400).json({ error: "Invalid input format" });
      }
  
      // Initialize total and validate medicines
      let total = 0;
      for (const item of med) {
        const { mid, quantity } = item;
  
        if (!mid || !quantity || quantity <= 0) {
          return res.status(400).json({ error: "Invalid medicine input" });
        }
  
        // Fetch the medicine details from the Medicine collection
        const medicine = await Medicine.findOne({ mid });
        if (!medicine) {
          return res.status(404).json({ error: `Medicine with ID ${mid} not found` });
        }
  
        // Add the price to the total
        total += medicine.price * quantity;
      }
  
      // Generate a unique `bid` (bill ID)
      const bid = `B${Date.now()}`; // Example: "B1678425472347"
  
      let Timestamp = new Date()
      Timestamp = Timestamp.toDateString()
      // Create a new bill document
      const newBill = new Bill({
        bid,
        Timestamp,
        UHID,
        med,
        total
      });
  
      // Save the bill to the database
      await newBill.save();
  
      // Send the response
      res.status(201).json({
        message: "Bill created successfully",
        bid,
        Timestamp,
        UHID,
        med,
        total,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


router.get("/generatebill/:bid", async (req, res) => {
  try{
    // console.log(req)
    const { bid } = req.params;  // Correct way to extract bid from params

    const bill = await Bill.findOne({ bid });
    console.log(bill)
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const patient = await Patient.findOne({ UHID: bill.UHID });
    console.log(patient)
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    
    const medicineDetails = await Promise.all(
      bill.med.map(async (medicine) => {
        const medDetails = await Medicine.findOne({ mid: medicine.mid });
        if (!medDetails) {
          throw new Error(`Medicine with ID ${medicine.mid} not found`);
        }
        return {
          mid: medicine.mid,
          quantity: medicine.quantity,
          price: medDetails.price,
          name: medDetails.name,
        };
      })
    );

    const response = {
      bid: bill.bid,
      patient: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        UHID: patient.UHID,
        age: patient.age,
      },
      medicines: medicineDetails,
      billDate: bill.Timestamp,
      total: bill.total,
    };

    res.json(response);

  }catch(error){
    console.error('Error generating bill:', error);
    res.status(500).json({ error: 'An error occurred while generating the bill' });
  
  }
});

router.delete("/deletebill/:bid", async (req, res) => {
  try {
    const { bid } = req.params;  // Extracting the bid from params

    // Find the bill by its bid
    const bill = await Bill.findOne({ bid });
    
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Delete the bill from the database
    await Bill.deleteOne({ bid });

    // Send the response
    res.status(200).json({
      message: `Bill with ID ${bid} has been deleted successfully.`,
    });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ error: 'An error occurred while deleting the bill' });
  }
});

module.exports = router;

