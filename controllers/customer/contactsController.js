const pool = require("../../config/db");
const moment = require("moment-timezone");
const { v4: uuidv4 } = require("uuid");
const logger = require("../../logger.js");


const getAllContacts = async (req, res) => {
  try {
        const connection = await pool.getConnection();
        const { user_uuid } = req.params;

      const getquery = 
        `SELECT * FROM contacts WHERE contact_status = ? AND user_uuid = ? ORDER BY contact_created_at DESC`;
  
      const [contacts] = await connection.execute(getquery, [1, user_uuid]);
  
      res.status(200).send({
        message: "Successfully Fetched List Of All Contacts",
       // totalCount: contacts.length,
        contacts,
        
      });
      connection.release();
    } catch (err) {
        logger.error(`Error in getting the list, Error: ${err} `);
        res.status(500).send({ message: "An error occurred while fetching contacts", Error: err });
    }
  };
  
const getContact = async (req, res) => {
    try {

        const { contact_uuid } = req.params;
        const connection = await pool.getConnection();
  
        
      const query = `
        SELECT * FROM contacts WHERE contact_uuid = ? AND contact_status = ? ORDER BY contact_created_at DESC`;
  
      const [results] = await connection.execute(query, [contact_uuid, 1]);
  
      if (results.length === 0) {
        return res.status(404).send({ error: "Contact not found" });
      }
  
      res.status(200).send({
        message: "Successfully fetched the Contacts details",
       // totalCount: results.length,
        results,
      });
      connection.release();
    } catch (err) {
      logger.error(`Error in getting data, Error: ${err} `);
      res.status(500).send({ message: "Error in data", Error: err });
    }
  };

const saveContact = async (req, res) => {

    try {
        const {
            contact_first_name,
            contact_last_name,
            contact_email,
            contact_mobile,
            //contact_status
          } = req.body;

    // Connection to the database
    const connection = await pool.getConnection();

    const { user_uuid } = req.params;


  
      const contact_created_at = new Date();
      const currentTimeIST = moment
        .tz(contact_created_at, "Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss ");
  
      const newUuid = uuidv4();
  
      const queriesToGet = `
        SELECT * FROM contacts WHERE contact_email = ? OR contact_mobile = ?`;
  
      const [result] = await connection.execute(queriesToGet, [
        contact_email,
        contact_mobile,
      ]);
  
      if (result.length > 0) {
        return res
        .status(400)
        .json({ message: "Contacts in Email and Mobile Number already exists" });
    }
  
      const insertQuery = `
        INSERT INTO contacts (user_uuid, contact_uuid, contact_first_name, contact_last_name, contact_email, contact_mobile, contact_status, contact_created_at, contact_created_by, contact_modified_at, contact_modified_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
      const insertData = [
        user_uuid,
        newUuid,
        contact_first_name,
        contact_last_name,
        contact_email,
        contact_mobile,
        parseInt(1),
        currentTimeIST,
        user_uuid,
        currentTimeIST,
        user_uuid,
      ];
  
      const [insertResults] = await connection.execute(insertQuery, insertData);
  
      res.status(201).json({
        message: "Contact added successfully",
        totalCount: insertResults.length,
        insertResults,
      });
  
      connection.release();
    } catch (err) {
      logger.error(`Error in adding Contact: ${err}`);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  
const editContact = async (req, res) => {
  
    try {
   
        const {
            contact_first_name,
            contact_last_name,
            contact_email,
            contact_mobile,
          } = req.body;

          const { contact_uuid } = req.params;
     // Connection to database
         const connection = await pool.getConnection();

          const contact_modified_at = new Date();
          const currentTimeIST2 = moment
         .tz(contact_modified_at, "Asia/Kolkata")
         .format("YYYY-MM-DD HH:mm:ss");
  
      // Check if the updated email or mobile already exist for another contact
      const queriesToGet = `
        SELECT * FROM contacts WHERE (contact_email = ? OR contact_mobile = ?) AND contact_uuid != ?`;
    
      const [result] = await connection.execute(queriesToGet, [
        contact_email,
        contact_mobile,
        contact_uuid,
      ]);
    
      if (result.length > 0) {
        return res.status(400).send({ error: "Contact already exists with the provided email or mobile" });
      }
  
      const query = `
        UPDATE contacts SET contact_first_name = ? , contact_last_name = ? , contact_email = ? , contact_mobile = ? , contact_modified_at = ?, contact_modified_by = ? WHERE contact_uuid = ?`;
  
      const updateData = [
        contact_first_name,
        contact_last_name,
        contact_email,
        contact_mobile,
        currentTimeIST2,
        contact_uuid,
        //req.body.user_uuid,
        contact_uuid,
      ];
  
      const [results] = await connection.execute(query, updateData);
  
      res.status(201).json({
        message: "Contacts updated successfully",
        totalCount: results.length,
        results,
      });
      connection.release();
    } catch (err) {
      logger.error(`Error in updating Contacts: ${err}`);
      res.status(500).send({ message: "Error in updating Contacts", err });
    }
  };

const deleteContact = async (req, res) => {
  try {
       const { contact_uuid } = req.params;

    //connection to database
    const connection = await pool.getConnection();

    //creating current date and time
    let createdAt = new Date();
    let currentTimeIST = moment
      .tz(createdAt, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss ");

     // writing the query
    const queryMade = `UPDATE contacts SET contact_status = ?, contact_modified_at = ?, contact_modified_by = ?  WHERE contact_uuid = ?`;

    // executing ...
    const [results] = await connection.execute(queryMade, [
        0,
        currentTimeIST,
        req.body.user_uuid,
        contact_uuid

    ]);

    res.status(201).send({
        message: "Contacts deleted successfully",
        totalCount: results.length,
        results,
      });
      connection.release();
    } catch (err) {
      logger.error(`Error in deleting the Contacts ${err}`);
      res
        .status(500)
        .send({ message: "Error in deleting the contacts", Error: err });
    }
  };
//exports.....
module.exports = {
  getAllContacts,
  getContact,
  saveContact,
  editContact,
  deleteContact,
};