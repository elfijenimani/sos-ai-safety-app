const express = require("express");
const MedicalProfile = require("../models/MedicalProfile");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE MEDICAL PROFILE
router.post("/", protect, async (req, res) => {
  try {
    const existingProfile = await MedicalProfile.findOne({
      user: req.user._id,
    });

    if (existingProfile) {
      return res.status(400).json({
        message: "Medical profile already exists. Use update instead.",
      });
    }

    const {
      fullName,
      birthDate,
      bloodType,
      allergies,
      medicalConditions,
      medications,
      notes,
    } = req.body;

    if (!fullName) {
      return res.status(400).json({
        message: "Full name is required.",
      });
    }

    const medicalProfile = await MedicalProfile.create({
      user: req.user._id,
      fullName,
      birthDate,
      bloodType,
      allergies,
      medicalConditions,
      medications,
      notes,
    });

    return res.status(201).json({
      message: "Medical profile created successfully.",
      medicalProfile,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while creating medical profile.",
      error: error.message,
    });
  }
});

// READ MEDICAL PROFILE
router.get("/", protect, async (req, res) => {
  try {
    const medicalProfile = await MedicalProfile.findOne({
      user: req.user._id,
    });

    if (!medicalProfile) {
      return res.status(404).json({
        message: "Medical profile not found.",
      });
    }

    return res.status(200).json({
      medicalProfile,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching medical profile.",
      error: error.message,
    });
  }
});

// UPDATE MEDICAL PROFILE
router.put("/", protect, async (req, res) => {
  try {
    const medicalProfile = await MedicalProfile.findOne({
      user: req.user._id,
    });

    if (!medicalProfile) {
      return res.status(404).json({
        message: "Medical profile not found.",
      });
    }

    medicalProfile.fullName = req.body.fullName || medicalProfile.fullName;
    medicalProfile.birthDate = req.body.birthDate || medicalProfile.birthDate;
    medicalProfile.bloodType = req.body.bloodType || medicalProfile.bloodType;
    medicalProfile.allergies = req.body.allergies || medicalProfile.allergies;
    medicalProfile.medicalConditions =
      req.body.medicalConditions || medicalProfile.medicalConditions;
    medicalProfile.medications =
      req.body.medications || medicalProfile.medications;
    medicalProfile.notes = req.body.notes || medicalProfile.notes;

    const updatedProfile = await medicalProfile.save();

    return res.status(200).json({
      message: "Medical profile updated successfully.",
      medicalProfile: updatedProfile,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while updating medical profile.",
      error: error.message,
    });
  }
});

// DELETE MEDICAL PROFILE
router.delete("/", protect, async (req, res) => {
  try {
    const medicalProfile = await MedicalProfile.findOne({
      user: req.user._id,
    });

    if (!medicalProfile) {
      return res.status(404).json({
        message: "Medical profile not found.",
      });
    }

    await medicalProfile.deleteOne();

    return res.status(200).json({
      message: "Medical profile deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while deleting medical profile.",
      error: error.message,
    });
  }
});

module.exports = router;