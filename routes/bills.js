const express = require('express')
const Bill = require("../models/Bill")
const Medicine = require("../models/Medicine")
const Patient = require("../models/Patient")
const mongoose = require('mongoose');

const router = express.Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     Bill:
 *       type: object
 *       properties:
 *         bid:
 *           type: string
 *           description: Unique identifier for the bill
 *         Timestamp:
 *           type: string
 *           description: Timestamp of the bill creation
 *         UHID:
 *           type: string
 *           description: Unique Hospital ID
 *         med:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               mid:
 *                 type: string
 *                 description: Medicine ID
 *               quantity:
 *                 type: number
 *                 description: Quantity of the medicine
 *         total:
 *           type: number
 *           description: Total amount of the bill
 *       required:
 *         - bid
 *         - Timestamp
 *         - UHID
 *         - med
 *         - total
 * 
 * /api/createbill:
 *   post:
 *     summary: Create a new bill
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Bill'
 *     responses:
 *       200:
 *         description: Bill created successfully
 *       400:
 *         description: Bad request
 */


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
  
      //let date = new Date()
      // Create a new bill document
      const newBill = new Bill({
        bid,
        UHID,
        med,
        total,
        Date:new Date()
      });
  
      // Save the bill to the database
      await newBill.save();
  
      // Send the response
      res.status(201).json({
        message: "Bill created successfully",
        bid,
        UHID,
        med,
        total,
        Date:new Date()
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

/**
 * @swagger
 * /api/generatebill/:bid:
 *   get:
 *     summary: Retrieve a bill with detailed patient and medicine information
 *     description: This endpoint retrieves a bill by its ID (bid). It includes details about the patient and the medicines in the bill.
 *     parameters:
 *       - in: path
 *         name: bid
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the bill
 *     responses:
 *       200:
 *         description: Bill retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bid:
 *                   type: string
 *                   description: Unique ID of the bill
 *                 patient:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                       description: First name of the patient
 *                     lastName:
 *                       type: string
 *                       description: Last name of the patient
 *                     UHID:
 *                       type: string
 *                       description: Unique Hospital ID of the patient
 *                     age:
 *                       type: integer
 *                       description: Age of the patient
 *                 medicines:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       mid:
 *                         type: string
 *                         description: Medicine ID
 *                       name:
 *                         type: string
 *                         description: Name of the medicine
 *                       quantity:
 *                         type: integer
 *                         description: Quantity of the medicine
 *                       price:
 *                         type: number
 *                         description: Price of the medicine
 *                 billDate:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp of when the bill was created
 *                 total:
 *                   type: number
 *                   description: Total amount of the bill
 *       404:
 *         description: Bill or patient not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */

router.get("/generatebill/:bid", async (req, res) => {
  try{
    console.log(req)
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

