import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import connectDB from "./config/database.js";
import User from "./models/UserPG.js";
import Dog from "./models/DogPG.js";
import Like from "./models/LikePG.js";
import Match from "./models/MatchPG.js";

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://shaw2024.github.io"
  ],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.get("/", (req, res) => {
  res.send("PawPawSocial API is running with MongoDB Atlas");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", database: "mongodb", timestamp: new Date() });
});

// Auth routes
app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.create({ name, email, password });
    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("Register error:", error);
    res.status(400).json({ message: error.message });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user: { id: user.id, name: user.name, email: user.email }, token: "demo-token" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Dog routes
app.post("/dogs/create", async (req, res) => {
  try {
    const dog = new Dog(req.body);
    await dog.save();
    res.status(201).json(dog);
  } catch (error) {
    console.error("Create dog error:", error);
    res.status(400).json({ message: error.message });
  }
});

app.get("/dogs/all", async (req, res) => {
  try {
    const dogs = await Dog.find({}).sort({ createdAt: -1 });
    res.json(dogs);
  } catch (error) {
    console.error("Get all dogs error:", error);
    res.status(400).json({ message: error.message });
  }
});

app.get("/dogs/mine", async (req, res) => {
  try {
    const dogs = await Dog.find({ ownerId: 1 }).sort({ createdAt: -1 });
    res.json(dogs);
  } catch (error) {
    console.error("Get my dogs error:", error);
    res.status(400).json({ message: error.message });
  }
});

app.get("/dogs/discover/:dogId", async (req, res) => {
  try {
    const { dogId } = req.params;
    const dogs = await Dog.find({ _id: { $ne: dogId } }).limit(50);
    res.json(dogs);
  } catch (error) {
    console.error("Discover dogs error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Match routes
app.post("/match/action", async (req, res) => {
  try {
    const { dogId, targetDogId, action } = req.body;
    
    if (action === "like") {
      await Like.create({ dogId, targetDogId });
      
      // Check for mutual like
      const mutualLike = await Like.findOne({
        where: { dogId: targetDogId, targetDogId: dogId }
      });
      
      if (mutualLike) {
        await Match.create({ dog1Id: dogId, dog2Id: targetDogId });
        return res.json({ match: true });
      }
    }
    
    res.json({ match: false });
  } catch (error) {
    console.error("Match action error:", error);
    res.status(400).json({ message: error.message });
  }
});

app.get("/match/list/:dogId", async (req, res) => {
  try {
    const { dogId } = req.params;
    const matches = await Match.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { dog1Id: dogId },
          { dog2Id: dogId }
        ]
      }
    });
    res.json(matches);
  } catch (error) {
    console.error("Get matches error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    message: "Internal server error", 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

const PORT = process.env.PORT || 4000;

// Start server and sync database
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    console.log('✅ MongoDB Atlas connected');
    app.listen(PORT, () => {
      console.log(`✅ API running on port ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
