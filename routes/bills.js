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
    const { UHID, reg_no, med } = req.body
    //const pid = req.body.UHID;
    //const med = req.body.med
    //const reg_no = req.body.reg_no
    console.log(req.body)
    //const {patient} = req.body.pid;
    //const UHID = pid;
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
      console.log(total)
    }

    // Generate a unique `bid` (bill ID)
    const bid = `B${Date.now()}`; // Example: "B1678425472347"

    //let date = new Date()
    // Create a new bill document
    const newBill = new Bill({
      bid,
      UHID,
      reg_no,
      med,
      total,
      Date: new Date()
    });

    // Save the bill to the database
    await newBill.save();

    // Send the response
    res.status(201).json({
      message: "Bill created successfully",
      bid,
      UHID,
      reg_no,
      med,
      total,
      Date: new Date()
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
  try {
    console.log(req)
    const { bid } = req.params;

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

  } catch (error) {
    console.error('Error generating bill:', error);
    res.status(500).json({ error: 'An error occurred while generating the bill' });

  }
});
/**
 * @swagger
 * /api/getbills:
 *   get:
 *     summary: Retrieve bills of patient with UHID and its medicine information
 *     description: This endpoint retrieve bills by its patient ID (uhid). It includes details about the medicines in the bill.
 *     responses:
 *       200:
 *         description: Bills retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Unique identifier for the order
 *                 bid:
 *                   type: string
 *                   description: Unique ID of the bill
 *                 UHID:
 *                   type: string
 *                   description: Unique Health ID of the patient
 *                 reg_no:
 *                   type: string
 *                   description: Registration number of the patient
 *                 med:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                        mid:
 *                         type: string
 *                         description: Medicine ID
 *                        quantity:
 *                         type: integer
 *                         description: Quantity of the medicine
 *                 total:
 *                   type: integer
 *                   description: Total bill amount
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
router.get("/getbills", async (req, res) => {
  try {
    const bills = await Bill.find();
    if (!bills || bills.length === 0) {
      return res.status(404).json({ error: 'No bills found' });
    }

    const billsWithMedicineDetails = await Promise.all(
      bills.map(async (bill) => {
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
        return {
          ...bill._doc,
          medicines: medicineDetails,
        };
      })
    );

    console.log(billsWithMedicineDetails);
    res.status(200).json(billsWithMedicineDetails);
  } catch (error) {
    console.error('Error retrieving bills:', error.message);
    res.status(500).json({ error: 'An error occurred while retrieving the bills' });
  }
});

/**
 * @swagger
 * /api/deletebill/{bid}:
 *   delete:
 *     summary: Delete a bill by its ID
 *     description: This endpoint deletes a bill by its unique ID (bid) from the database.
 *     parameters:
 *       - in: path
 *         name: bid
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the bill to be deleted
 *     responses:
 *       200:
 *         description: Bill deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message indicating the bill was deleted
 *       404:
 *         description: Bill not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message indicating the bill was not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message indicating a server error
 */


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

router.get("/search/patients", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }
    //const patient = await Patient.findOne({UHID});
    //  console.log(req.query)

    const regex = new RegExp(query, 'i');

    const results = await Patient.find({ UHID: regex }).limit(10); // Limit to top 10 results for performance
    res.status(200).json({ results });
  } catch (error) {
    console.error('Error fetching from DB:', error);
    res.status(500).json({ error: 'An error occurred while fetching patients details' });
  }
});


router.get("/search/doctors", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Query parameter is missing" })
    }

    const regex = new RegExp(query, 'i')
    const results = await mongoose.connection.collection('doctors').find({ reg_no: regex }).limit(10).toArray()
    res.status(200).json({ results });


  } catch (error) {
    console.error('Error fetching from DB:', error);
    res.status(500).json({ error: 'An error occurred while fetching doctor details' });
  }
})



router.get("/search/medicines", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Query parameter is missing" })
    }

    const regex = new RegExp(query, 'i')
    const results = await Medicine.find({ name: regex }).limit(10)
    res.status(200).json({ results });


  } catch (error) {
    console.error('Error fetching from DB:', error);
    res.status(500).json({ error: 'An error occurred while fetching medicines' });
  }
})
/**
 * @swagger
 * /api/getbill/:UHID:
 *   get:
 *     summary: Retrieve bills of patient with UHID and its medicine information
 *     description: This endpoint retrieve bills by its patient ID (uhid). It includes details about the medicines in the bill.
 *     parameters:
 *       - in: path
 *         name: UHID
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the patient
 *     responses:
 *       200:
 *         description: Bills retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Unique identifier for the order
 *                 bid:
 *                   type: string
 *                   description: Unique ID of the bill
 *                 UHID:
 *                   type: string
 *                   description: Unique Health ID of the patient
 *                 reg_no:
 *                   type: string
 *                   description: Registration number of the patient
 *                 med:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                        mid:
 *                         type: string
 *                         description: Medicine ID
 *                        quantity:
 *                         type: integer
 *                         description: Quantity of the medicine
 *                 total:
 *                   type: integer
 *                   description: Total bill amount
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
router.get("/getbill/:UHID", async (req, res) => {
  try {
    const uhid = req.params.UHID;
    const patient = await mongoose.connection.db.collection('patients').findOne({ UHID: uhid });
    if (!patient) {
      return res.status(404).json({ error: `Patient with ID ${uhid} not found` });
    }
    const bills = await Bill.find({ UHID: uhid });
    if (!bills || bills.length === 0) {
      return res.status(404).json({ error: 'No bills found' });
    }
    const billsWithMedicineDetails = await Promise.all(
      bills.map(async (bill) => {
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
        return {
          ...bill._doc,
          medicines: medicineDetails,
        };
      })
    );
    console.log(billsWithMedicineDetails);
    res.status(200).json(billsWithMedicineDetails);
  } catch (error) {
    console.error('Error retrieving bills:', error.message);
    res.status(500).json({ error: 'An error occurred while retrieving the bills' });
  }
});
module.exports = router;

