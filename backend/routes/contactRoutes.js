const express = require("express");
const Contact = require("../models/Contact");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE CONTACT
router.post("/", protect, async (req, res) => {
  try {
    const { name, phone, relationship, notes, isPrimary } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        message: "Name and phone number are required.",
      });
    }

    const contact = await Contact.create({
      user: req.user._id,
      name,
      phone,
      relationship,
      notes,
      isPrimary,
    });

    return res.status(201).json({
      message: "Contact created successfully.",
      contact,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while creating contact.",
      error: error.message,
    });
  }
});

// READ ALL CONTACTS
router.get("/", protect, async (req, res) => {
  try {
    const contacts = await Contact.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      count: contacts.length,
      contacts,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching contacts.",
      error: error.message,
    });
  }
});

// UPDATE CONTACT
router.put("/:id", protect, async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found.",
      });
    }

    contact.name = req.body.name || contact.name;
    contact.phone = req.body.phone || contact.phone;
    contact.relationship = req.body.relationship || contact.relationship;
    contact.notes = req.body.notes || contact.notes;

    if (req.body.isPrimary !== undefined) {
      contact.isPrimary = req.body.isPrimary;
    }

    const updatedContact = await contact.save();

    return res.status(200).json({
      message: "Contact updated successfully.",
      contact: updatedContact,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while updating contact.",
      error: error.message,
    });
  }
});

// DELETE CONTACT
router.delete("/:id", protect, async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found.",
      });
    }

    await contact.deleteOne();

    return res.status(200).json({
      message: "Contact deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while deleting contact.",
      error: error.message,
    });
  }
});

module.exports = router;