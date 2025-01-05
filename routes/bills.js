const express = require('express')
const Bill = require("../models/Bill")
const Medicine = require("../models/Medicine")
const mongoose = require('mongoose');

const router = express.Router()


router.post("/createbill", async (req, res) => {
    try {
      // Extract medicines from the request body
      const { pid, med } = req.body;
      //const {patient} = req.body.pid;
      if (!pid) {
        return res.status(400).json({ error: 'Patient ID (pid) is required' });
      }
      const patient = await mongoose.connection.db.collection('patients').findOne({ pid });
        if (!patient) {
            return res.status(404).json({ error: `Patient with ID ${pid} not found` });
        }
      
      console.log(med)
      console.log(pid)
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
  
      // Create a new bill document
      const newBill = new Bill({
        bid,
        pid,
        med,
        total
      });
  
      // Save the bill to the database
      await newBill.save();
  
      // Send the response
      res.status(201).json({
        message: "Bill created successfully",
        bid,
        pid,
        med,
        total,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });




  
module.exports = router;

