const express = require("express");
const SafePlace = require("../models/SafePlace");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const earthRadiusKm = 6371;

  const toRadians = (value) => {
    return (value * Math.PI) / 180;
  };

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

// CREATE SAFE PLACE
router.post("/", protect, async (req, res) => {
  try {
    const {
      name,
      type,
      address,
      latitude,
      longitude,
      notes,
      isPrimarySafePlace,
    } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        message: "Name, latitude and longitude are required.",
      });
    }

    const safePlace = await SafePlace.create({
      user: req.user._id,
      name,
      type,
      address,
      latitude,
      longitude,
      notes,
      isPrimarySafePlace,
    });

    return res.status(201).json({
      message: "Safe place created successfully.",
      safePlace,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while creating safe place.",
      error: error.message,
    });
  }
});

// READ ALL SAFE PLACES
router.get("/", protect, async (req, res) => {
  try {
    const safePlaces = await SafePlace.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      count: safePlaces.length,
      safePlaces,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching safe places.",
      error: error.message,
    });
  }
});

// FIND NEAREST SAFE PLACE
router.get("/nearest", protect, async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        message: "Current latitude and longitude are required.",
      });
    }

    const currentLatitude = Number(lat);
    const currentLongitude = Number(lng);

    const safePlaces = await SafePlace.find({ user: req.user._id });

    if (safePlaces.length === 0) {
      return res.status(404).json({
        message: "No safe places found.",
      });
    }

    const placesWithDistance = safePlaces.map((place) => {
      const distanceKm = calculateDistanceKm(
        currentLatitude,
        currentLongitude,
        place.latitude,
        place.longitude
      );

      return {
        ...place.toObject(),
        distanceKm: Number(distanceKm.toFixed(2)),
      };
    });

    placesWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);

    return res.status(200).json({
      nearestSafePlace: placesWithDistance[0],
      allSafePlacesByDistance: placesWithDistance,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while finding nearest safe place.",
      error: error.message,
    });
  }
});

// UPDATE SAFE PLACE
router.put("/:id", protect, async (req, res) => {
  try {
    const safePlace = await SafePlace.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!safePlace) {
      return res.status(404).json({
        message: "Safe place not found.",
      });
    }

    if (req.body.name) safePlace.name = req.body.name;
    if (req.body.type) safePlace.type = req.body.type;
    if (req.body.address !== undefined) safePlace.address = req.body.address;
    if (req.body.latitude !== undefined) safePlace.latitude = req.body.latitude;
    if (req.body.longitude !== undefined) safePlace.longitude = req.body.longitude;
    if (req.body.notes !== undefined) safePlace.notes = req.body.notes;

    if (req.body.isPrimarySafePlace !== undefined) {
      safePlace.isPrimarySafePlace = req.body.isPrimarySafePlace;
    }

    const updatedSafePlace = await safePlace.save();

    return res.status(200).json({
      message: "Safe place updated successfully.",
      safePlace: updatedSafePlace,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while updating safe place.",
      error: error.message,
    });
  }
});

// DELETE SAFE PLACE
router.delete("/:id", protect, async (req, res) => {
  try {
    const safePlace = await SafePlace.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!safePlace) {
      return res.status(404).json({
        message: "Safe place not found.",
      });
    }

    await safePlace.deleteOne();

    return res.status(200).json({
      message: "Safe place deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while deleting safe place.",
      error: error.message,
    });
  }
});

module.exports = router;