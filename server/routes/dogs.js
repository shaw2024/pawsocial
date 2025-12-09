import express from "express";
import Dog from "../models/Dog.js";
import { auth } from "../middleware/auth.js";
import mongoose from "mongoose";

const router = express.Router();

// Bypass auth - use a fake user ID for testing
const BYPASS_USER_ID = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");

// Create dog profile
router.post("/create", async (req, res) => {
  try {
    const {
      name,
      age,
      breed,
      gender,
      energy,
      temperament = [],
      vaccinated,
      images = [],
      city,
      zip
    } = req.body;

    const dog = await Dog.create({
      ownerId: BYPASS_USER_ID,
      name,
      age,
      breed,
      gender,
      energy,
      temperament,
      vaccinated,
      images, // array of base64 or URLs
      location: { city, zip }
    });

    res.json(dog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error creating dog" });
  }
});

// Get my dogs
router.get("/mine", async (req, res) => {
  try {
    const dogs = await Dog.find({ ownerId: BYPASS_USER_ID });
    res.json(dogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get all dogs for community feed
router.get("/all", async (req, res) => {
  try {
    const dogs = await Dog.find({}).sort({ createdAt: -1 }).limit(50);
    res.json(dogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Discover other dogs for a given dogId
router.get("/discover/:dogId", async (req, res) => {
  try {
    const myDogId = req.params.dogId;
    const dogs = await Dog.find({ _id: { $ne: myDogId } })
      .limit(20);
    res.json(dogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
