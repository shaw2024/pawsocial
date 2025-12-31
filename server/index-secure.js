import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import purify from 'isomorphic-dompurify';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '24h';

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Helmet for security headers
app.use(helmet());

// CORS with explicit whitelist
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

// Rate limiting - general
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting - authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

app.use(limiter);

// Limit JSON payload size to 5MB
app.use(express.json({ limit: '5mb' }));

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed' });
  }
  next();
};

// Input sanitization helper
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return purify.sanitize(input).trim();
};

// ============================================================================
// DATABASE SCHEMAS
// ============================================================================

// User Schema - for authentication
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /.+\@.+\..+/ },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Dog Schema
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
  roomId: { type: String, required: true },
  userId: String,
  userName: { type: String, trim: true, maxlength: 100 },
  userEmail: { type: String, trim: true, maxlength: 254 },
  text: { type: String, required: true, trim: true, maxlength: 1000 },
  isAI: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

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

// ============================================================================
// AI RESPONSE HELPER
// ============================================================================

async function getAIResponse(question, roomTopic) {
  try {
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
            content: `You are a helpful dog expert in the "${sanitizeInput(roomTopic)}" community room. Answer this question concisely (1-2 sentences): ${sanitizeInput(question)}`
          }]
        })
      });
      const data = await response.json();
      return data.content?.[0]?.text || "I'm unable to answer that question right now.";
    }
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

// ============================================================================
// ROUTES - HEALTH & AUTHENTICATION
// ============================================================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Register new user
app.post('/auth/register', [
  authLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create new user
    const user = new User({ email, password: hashedPassword });
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    res.status(201).json({ 
      message: 'User registered successfully',
      token,
      user: { id: user._id, email: user.email }
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/auth/login', [
  authLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcryptjs.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    res.json({ 
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Guest login
app.post('/auth/guest', [authLimiter], async (req, res) => {
  try {
    const guestId = 'guest_' + Date.now();
    const token = jwt.sign({ id: guestId, email: 'guest@pawsocial.app', isGuest: true }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    
    res.json({
      message: 'Guest login successful',
      token,
      user: { id: guestId, email: 'guest@pawsocial.app', isGuest: true }
    });
  } catch (err) {
    console.error('Guest login error:', err.message);
    res.status(500).json({ error: 'Guest login failed' });
  }
});

// ============================================================================
// ROUTES - COMMUNITY ROOMS
// ============================================================================

app.get('/community-rooms', async (req, res) => {
  try {
    let rooms = await CommunityRoom.find();
    
    if (rooms.length === 0) {
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
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

app.get('/community-rooms/:roomId/messages', [param('roomId').isMongoId()], handleValidationErrors, async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId })
      .sort({ createdAt: 1 })
      .limit(50);
    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/community-rooms/:roomId/message', [
  param('roomId').isMongoId(),
  body('text').notEmpty().trim().isLength({ max: 1000 })
], handleValidationErrors, async (req, res) => {
  try {
    const { userId, userName, userEmail, text } = req.body;
    const { roomId } = req.params;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }
    
    // Save user message with sanitized text
    const userMessage = new Message({
      roomId,
      userId,
      userName: sanitizeInput(userName || 'Anonymous'),
      userEmail: sanitizeInput(userEmail),
      text: sanitizeInput(text),
      isAI: false
    });
    
    await userMessage.save();
    
    // Return only user message - no AI responses, only customer-to-customer interaction
    res.json({ userMessage, aiMessage: null });
  } catch (err) {
    console.error('Error posting message:', err);
    res.status(500).json({ error: 'Failed to post message' });
  }
});

// ============================================================================
// ROUTES - DOGS
// ============================================================================

app.post('/dogs/create', [
  authenticateToken,
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('breed').optional().trim().isLength({ max: 100 }),
  body('age').optional().isInt({ min: 0, max: 50 }),
  body('images').isArray({ min: 1 }).custom((images) => {
    // Validate each image is a proper base64 string
    return images.every(img => typeof img === 'string' && img.startsWith('data:image/') && img.length < 5242880);
  })
], handleValidationErrors, async (req, res) => {
  try {
    const { name, breed, age, gender, energy, temperament, vaccinated, images, city, zip } = req.body;
    const userId = req.user.id;
    
    // Validate images
    const validImages = images && images.length > 0 
      ? images.filter(img => typeof img === 'string' && img.startsWith('data:image/'))
      : [];
    
    if (validImages.length === 0) {
      return res.status(400).json({ error: 'At least one valid image is required' });
    }
    
    // Limit images per dog to 5
    const limitedImages = validImages.slice(0, 5);
    
    const dog = new Dog({
      name: sanitizeInput(name),
      breed: sanitizeInput(breed),
      age,
      gender: sanitizeInput(gender),
      energy: sanitizeInput(energy),
      temperament: (temperament || []).map(t => sanitizeInput(t)),
      vaccinated,
      images: limitedImages,
      city: sanitizeInput(city),
      zip: sanitizeInput(zip),
      userId,
      likes: [],
      comments: []
    });

    await dog.save();
    res.status(201).json(dog);
  } catch (err) {
    console.error('Error creating dog:', err);
    res.status(500).json({ error: 'Failed to create dog profile' });
  }
});

app.get('/dogs/all', [
  query('skip').optional().isInt({ min: 0 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, async (req, res) => {
  try {
    const skip = parseInt(req.query.skip || 0);
    const limit = Math.min(parseInt(req.query.limit || 20), 100);
    
    const dogs = await Dog.find()
      .select('-images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json(dogs);
  } catch (err) {
    console.error('Error fetching dogs:', err);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

app.get('/dogs/:id/full', [param('id').isMongoId()], handleValidationErrors, async (req, res) => {
  try {
    const dog = await Dog.findById(req.params.id);
    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }
    res.json(dog);
  } catch (err) {
    console.error('Error fetching dog:', err);
    res.status(500).json({ error: 'Failed to fetch dog' });
  }
});

app.get('/dogs/:id/image', [param('id').isMongoId()], handleValidationErrors, async (req, res) => {
  try {
    const dog = await Dog.findById(req.params.id).select('images');
    
    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }
    
    const validImages = dog?.images?.filter(img => typeof img === 'string' && img.startsWith('data:image/')) || [];
    res.json(validImages);
  } catch (err) {
    console.error('Error fetching image:', err);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

app.get('/dogs/:id', [param('id').isMongoId()], handleValidationErrors, async (req, res) => {
  try {
    const dog = await Dog.findById(req.params.id);
    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }
    res.json(dog);
  } catch (err) {
    console.error('Error fetching dog:', err);
    res.status(500).json({ error: 'Failed to fetch dog' });
  }
});

app.post('/dogs/:id/like', [
  authenticateToken,
  param('id').isMongoId(),
  body('userId').notEmpty()
], handleValidationErrors, async (req, res) => {
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
    console.error('Error liking dog:', err);
    res.status(500).json({ error: 'Failed to like dog' });
  }
});

app.post('/dogs/:id/comment', [
  authenticateToken,
  param('id').isMongoId(),
  body('text').trim().isLength({ min: 1, max: 500 })
], handleValidationErrors, async (req, res) => {
  try {
    const { userId, userName, text } = req.body;
    const dog = await Dog.findById(req.params.id);
    
    if (!dog) return res.status(404).json({ error: 'Dog not found' });
    
    dog.comments.push({ 
      userId, 
      userName: sanitizeInput(userName || 'Anonymous'),
      text: sanitizeInput(text)
    });
    await dog.save();
    res.json(dog);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

app.delete('/dogs/:id', [
  authenticateToken,
  param('id').isMongoId()
], handleValidationErrors, async (req, res) => {
  try {
    const { userId } = req.body;
    const dog = await Dog.findById(req.params.id);
    
    if (!dog) return res.status(404).json({ error: 'Dog not found' });
    if (dog.userId !== userId) return res.status(403).json({ error: 'Not authorized to delete this dog' });
    
    await Dog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Dog deleted successfully' });
  } catch (err) {
    console.error('Error deleting dog:', err);
    res.status(500).json({ error: 'Failed to delete dog' });
  }
});

// ============================================================================
// SERVER START
// ============================================================================

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
