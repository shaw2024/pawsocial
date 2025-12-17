import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Dog Schema and Model
const dogSchema = new mongoose.Schema({
  name: { type: String, required: true },
  breed: String,
  age: Number,
  gender: String,
  energy: String,
  temperament: [String],
  vaccinated: Boolean,
  images: [String],
  city: String,
  zip: String,
  createdAt: { type: Date, default: Date.now }
});

const Dog = mongoose.model('Dog', dogSchema);

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/dogs/create', async (req, res) => {
  try {
    const { name, breed, age, gender, energy, temperament, vaccinated, images, city, zip } = req.body;
    
    const dog = new Dog({
      name,
      breed,
      age,
      gender,
      energy,
      temperament: temperament || [],
      vaccinated,
      images: images || [],
      city,
      zip
    });

    await dog.save();
    res.json(dog);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/dogs/all', async (req, res) => {
  try {
    const dogs = await Dog.find().sort({ createdAt: -1 }).limit(50);
    res.json(dogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/dogs/:id', async (req, res) => {
  try {
    const dog = await Dog.findById(req.params.id);
    res.json(dog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
async function start() {
  try {
    let mongoUrl = process.env.MONGO_URL;
    
    if (!mongoUrl || mongoUrl.includes('YOUR_')) {
      console.log('Starting in-memory MongoDB...');
      const mongod = await MongoMemoryServer.create();
      mongoUrl = mongod.getUri();
    }

    await mongoose.connect(mongoUrl);
    console.log('✅ MongoDB connected');

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
