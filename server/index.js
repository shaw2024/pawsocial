import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, param, validationResult } from 'express-validator';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import purify from 'isomorphic-dompurify';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '24h';

// Security Middleware
app.use(helmet());

// CORS configuration - whitelist specific origins
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://shaw2024.github.io',
      'https://pawsocial-api.onrender.com'
    ];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // limit auth attempts
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

app.use(limiter);

// Limit JSON payload size
app.use(express.json({ limit: '5mb' }));

// Limit JSON payload size
app.use(express.json({ limit: '5mb' }));

// Validation middleware helper
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

// Dog Schema and Model
const dogSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  breed: { type: String, trim: true, maxlength: 100 },
  age: { type: Number, min: 0, max: 50 },
  gender: { type: String, trim: true, enum: ['Male', 'Female', 'Unknown', ''] },
  energy: { type: String, trim: true, enum: ['Low', 'Medium', 'High', ''] },
  temperament: [{ type: String, trim: true, maxlength: 50 }],
  vaccinated: Boolean,
  images: [String],
  city: { type: String, trim: true, maxlength: 100 },
  zip: { type: String, trim: true, maxlength: 10 },
  userId: { type: String, required: true },
  likes: [String],
  comments: [{
    userId: String,
    userName: { type: String, trim: true, maxlength: 100 },
    text: { type: String, trim: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const Dog = mongoose.model('Dog', dogSchema);

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Community Room Schema
const communityRoomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500 },
  topic: { type: String, required: true, trim: true, maxlength: 100 },
  createdAt: { type: Date, default: Date.now }
});

const CommunityRoom = mongoose.model('CommunityRoom', communityRoomSchema);

// Message Schema
const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  userId: String,
  userName: { type: String, trim: true, maxlength: 100 },
  userEmail: { type: String, trim: true, maxlength: 254 },
  text: { type: String, required: true, trim: true, maxlength: 1000 },
  isAI: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true }
});

const Message = mongoose.model('Message', messageSchema);

// Meetup Schema
const meetupSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, trim: true, maxlength: 1000 },
  date: { type: Date, required: true },
  location: { type: String, required: true, trim: true, maxlength: 200 },
  city: { type: String, trim: true, maxlength: 100 },
  userId: String,
  userName: { type: String, trim: true, maxlength: 100 },
  userEmail: { type: String, trim: true, maxlength: 254 },
  attendees: { type: Number, default: 1 },
  maxAttendees: { type: Number, default: 20 },
  interestedUsers: [String],
  createdAt: { type: Date, default: Date.now, index: true }
});

const Meetup = mongoose.model('Meetup', meetupSchema);
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification error:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper function to sanitize user input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return purify.sanitize(input).trim();
};

// AI API Integration (using Fetch for any API)
const AI_API_KEY = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;

async function getAIResponse(question, roomTopic) {
  try {
    // Using Claude API via Anthropic if available
    if (process.env.ANTHROPIC_API_KEY) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `You are a helpful dog expert in the "${roomTopic}" community room. Answer this question concisely (1-2 sentences): ${sanitizeInput(question)}`
          }]
        })
      });
      const data = await response.json();
      return data.content?.[0]?.text || "I'm unable to answer that question right now.";
    }
    
    // Fallback: Simple rule-based responses
    return getDefaultDogAdvice(question, roomTopic);
  } catch (err) {
    console.error('Error getting AI response:', err);
    return getDefaultDogAdvice(question, roomTopic);
  }
}

function getDefaultDogAdvice(question, roomTopic) {
  const responses = {
    'Dog Training & Behavior': [
      'Start with positive reinforcement and be consistent with commands.',
      'Consider working with a professional dog trainer for challenging behaviors.',
      'Patience and repetition are key - dogs learn through practice!'
    ],
    'Health & Wellness': [
      'Regular vet check-ups are important for your dog\'s health.',
      'A balanced diet and daily exercise help keep dogs healthy.',
      'Consult your vet if you notice any health concerns.'
    ],
    'Breed Discussion': [
      'Different breeds have different needs and temperaments - research yours!',
      'Breed history can help you understand your dog\'s natural behaviors.',
      'Consider a breed\'s exercise and space requirements before adopting.'
    ],
    'Playtime & Activities': [
      'Dogs need regular play and mental stimulation to stay happy.',
      'Try different activities to see what your dog enjoys most.',
      'Interactive toys and games strengthen your bond with your dog.'
    ],
    'Puppies & New Owners': [
      'Socialization and early training are crucial for puppies.',
      'Be patient - puppies take time to house train and learn commands.',
      'Consider puppy classes to help with training and socialization.'
    ]
  };
  
  const topicResponses = responses[roomTopic] || responses['Dog Training & Behavior'];
  return topicResponses[Math.floor(Math.random() * topicResponses.length)];
}

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Community Rooms
app.get('/community-rooms', async (req, res) => {
  try {
    let rooms = await CommunityRoom.find();
    
    if (rooms.length === 0) {
      // Create default rooms
      const defaultRooms = [
        { name: 'Dog Training & Behavior', topic: 'Dog Training & Behavior', description: 'Tips, advice, and discussion about obedience, behavior problems, and training techniques' },
        { name: 'Health & Wellness', topic: 'Health & Wellness', description: 'Nutrition, exercise, grooming, vet care, and dog health concerns' },
        { name: 'Breed Discussion', topic: 'Breed Discussion', description: 'Breed-specific information, characteristics, and owner experiences' },
        { name: 'Playtime & Activities', topic: 'Playtime & Activities', description: 'Dog sports, games, activities, and entertainment ideas' },
        { name: 'Puppies & New Owners', topic: 'Puppies & New Owners', description: 'First-time owner advice, puppy care, and parenting tips' },
        { name: 'Meetup', topic: 'Meetup', description: 'Organize local dog meetups and connect with other dog owners in your area' }
      ];
      
      rooms = await CommunityRoom.insertMany(defaultRooms);
    }
    
    res.json(rooms);
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/community-rooms/:roomId/messages', async (req, res) => {
  try {
    // Use lean() to return plain objects instead of Mongoose documents for better performance
    const messages = await Message.find({ roomId: req.params.roomId })
      .sort({ createdAt: 1 })
      .limit(50)
      .lean()
      .exec();
    
    // Add caching headers for better performance
    res.set('Cache-Control', 'public, max-age=5');
    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/community-rooms/:roomId/message', async (req, res) => {
  try {
    const { userId, userName, userEmail, text } = req.body;
    const { roomId } = req.params;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }
    
    // Save user message
    const userMessage = new Message({
      roomId,
      userId,
      userName: userName || 'Anonymous',
      userEmail,
      text: text.trim(),
      isAI: false
    });
    
    await userMessage.save();
    
    // Return only user message - no AI responses, only customer-to-customer interaction
    res.json({ userMessage, aiMessage: null });
  } catch (err) {
    console.error('Error posting message:', err);
    res.status(500).json({ error: err.message });
  }
});

// Meetup Routes
app.get('/meetups', async (req, res) => {
  try {
    const meetups = await Meetup.find()
      .sort({ date: 1 })
      .limit(50);
    res.json(meetups);
  } catch (err) {
    console.error('Error fetching meetups:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/meetups/create', async (req, res) => {
  try {
    const { title, description, date, location, city, userId, userName, userEmail } = req.body;
    
    if (!title || !date || !location) {
      return res.status(400).json({ error: 'Title, date, and location are required' });
    }
    
    const meetup = new Meetup({
      title,
      description,
      date: new Date(date),
      location,
      city,
      userId,
      userName: userName || 'Anonymous',
      userEmail,
      attendees: 1,
      interestedUsers: [userId]
    });
    
    await meetup.save();
    res.json(meetup);
  } catch (err) {
    console.error('Error creating meetup:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/meetups/:meetupId/join', async (req, res) => {
  try {
    const { userId } = req.body;
    const meetup = await Meetup.findById(req.params.meetupId);
    
    if (!meetup) {
      return res.status(404).json({ error: 'Meetup not found' });
    }
    
    if (!meetup.interestedUsers.includes(userId)) {
      meetup.interestedUsers.push(userId);
      meetup.attendees = meetup.interestedUsers.length;
      await meetup.save();
    }
    
    res.json(meetup);
  } catch (err) {
    console.error('Error joining meetup:', err);
    res.status(500).json({ error: err.message });
  }
});

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/dogs/create', async (req, res) => {
  try {
    const { name, breed, age, gender, energy, temperament, vaccinated, images, city, zip, userId } = req.body;
    
    // Validate images
    const validImages = images && images.length > 0 
      ? images.filter(img => typeof img === 'string' && img.length > 100) // Ensure valid base64
      : [];
    
    if (validImages.length === 0 && images && images.length > 0) {
      return res.status(400).json({ error: 'Invalid image data. Please upload a valid image.' });
    }
    
    const dog = new Dog({
      name,
      breed,
      age,
      gender,
      energy,
      temperament: temperament || [],
      vaccinated,
      images: validImages || [],
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
    
    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }
    
    // Filter and return only valid images
    const validImages = dog?.images?.filter(img => typeof img === 'string' && img.length > 100) || [];
    
    res.json(validImages);
  } catch (err) {
    console.error('Error fetching image:', err);
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
