import express from "express";
import Like from "../models/Like.js";
import Match from "../models/Match.js";

const router = express.Router();

// Like or pass
router.post("/action", async (req, res) => {
  try {
    const { fromDog, toDog, action } = req.body;

    if (!fromDog || !toDog || !action) {
      return res.status(400).json({ msg: "Missing fields" });
    }

    await Like.create({ fromDog, toDog, action });

    let newMatch = null;

    if (action === "like") {
      const reverse = await Like.findOne({
        fromDog: toDog,
        toDog: fromDog,
        action: "like"
      });

      if (reverse) {
        const existingMatch = await Match.findOne({
          $or: [
            { dog1: fromDog, dog2: toDog },
            { dog1: toDog, dog2: fromDog }
          ]
        });

        if (!existingMatch) {
          newMatch = await Match.create({ dog1: fromDog, dog2: toDog });
        }
      }
    }

    res.json({ msg: "saved", match: newMatch });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get matches for a dog
router.get("/list/:dogId", async (req, res) => {
  try {
    const { dogId } = req.params;
    const matches = await Match.find({
      $or: [{ dog1: dogId }, { dog2: dogId }]
    }).populate("dog1 dog2");
    res.json(matches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
