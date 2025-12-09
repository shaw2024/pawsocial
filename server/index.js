import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
dotenv.config();

import authRoutes from "./routes/auth.js";
import dogRoutes from "./routes/dogs.js";
import matchRoutes from "./routes/match.js";

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://shaw2024.github.io",
    "https://pawsocial-client.onrender.com",
    /\.onrender\.com$/  // Allow all Render preview URLs
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
  res.send("Dog Matching API is running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

app.use("/auth", authRoutes);
app.use("/dogs", dogRoutes);
app.use("/match", matchRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    msg: "Internal server error", 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

const PORT = process.env.PORT || 4000;

// Start MongoDB Memory Server for development
async function startServer() {
  try {
    let mongoUrl = process.env.MONGODB_URI || process.env.MONGO_URL;
    
    // If using placeholder or not set, start in-memory MongoDB
    if (!mongoUrl || mongoUrl.includes("YOUR_MONGODB") || mongoUrl.includes("localhost")) {
      console.log("🚀 Starting in-memory MongoDB for development...");
      const mongod = await MongoMemoryServer.create();
      mongoUrl = mongod.getUri();
      console.log("📦 In-memory MongoDB URL:", mongoUrl);
    }

    await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log("✅ MongoDB connected");
    
    // Handle MongoDB connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
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
