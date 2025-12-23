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
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
    'https://shaw2024.github.io',
    'https://pawsocial-api.onrender.com'
  ],
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
  userId: String,
  likes: [String],
  comments: [{
    userId: String,
    userName: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const Dog = mongoose.model('Dog', dogSchema);

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/dogs/create', async (req, res) => {
  try {
    const { name, breed, age, gender, energy, temperament, vaccinated, images, city, zip, userId } = req.body;
    
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
      zip,
      userId,
      likes: [],
      comments: []
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
    const skip = parseInt(req.query.skip || 0);
    const limit = parseInt(req.query.limit || 20);
    const dogs = await Dog.find()
      .select('-images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json(dogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get dog with images
app.get('/dogs/:id/full', async (req, res) => {
  try {
    const dog = await Dog.findById(req.params.id);
    res.json(dog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get only image for a dog
app.get('/dogs/:id/image', async (req, res) => {
  try {
    const dog = await Dog.findById(req.params.id).select('images');
    res.json(dog?.images || []);
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

// Like/Unlike a dog
app.post('/dogs/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    const dog = await Dog.findById(req.params.id);
    
    if (!dog) return res.status(404).json({ error: 'Dog not found' });
    
    if (dog.likes.includes(userId)) {
      dog.likes = dog.likes.filter(id => id !== userId);
    } else {
      dog.likes.push(userId);
    }
    
    await dog.save();
    res.json(dog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add comment to a dog
app.post('/dogs/:id/comment', async (req, res) => {
  try {
    const { userId, userName, text } = req.body;
    const dog = await Dog.findById(req.params.id);
    
    if (!dog) return res.status(404).json({ error: 'Dog not found' });
    
    dog.comments.push({ userId, userName, text });
    await dog.save();
    res.json(dog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a dog (owner only)
app.delete('/dogs/:id', async (req, res) => {
  try {
    const { userId } = req.body;
    const dog = await Dog.findById(req.params.id);
    
    if (!dog) return res.status(404).json({ error: 'Dog not found' });
    if (dog.userId !== userId) return res.status(403).json({ error: 'Not authorized' });
    
    await Dog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Dog deleted successfully' });
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
