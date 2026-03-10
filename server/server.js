const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Database = require('./database');
const app = express();
const db = new Database();
const whitelist = [process.env.CLIENT_ORIGIN || 'http://localhost:5500', 'http://127.0.0.1:5500'];
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).send('Access token required');

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).send('Invalid token');
    req.user = decoded;
    next();
  });
}

// Helper function to validate note input
function validateNote(note) {
  if (!note.title || !note.title.trim()) {
    return 'Title is required';
  }
  if (!note.content || !note.content.trim()) {
    return 'Content is required';
  }
  if (note.title.length > 200) {
    return 'Title must be less than 200 characters';
  }
  if (note.content.length > 5000) {
    return 'Content must be less than 5000 characters';
  }
  return null;
}

// Helper function to validate user input
function validateUser(user) {
  if (!user.username || !user.username.trim()) {
    return 'Username is required';
  }
  if (!user.password || user.password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
}

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

app.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    const validationError = validateUser({ username, password });
    if (validationError) {
      return res.status(400).send(validationError);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.createUser({ username, password: hashedPassword });
    res.status(201).send({ message: 'User created' });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).send('Username already exists');
    } else {
      console.error('Error creating user:', error);
      res.status(500).send('Error creating user');
    }
  }
});

app.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await db.getUserByUsername(username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).send('Invalid credentials');
    }
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.send({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send('Error logging in');
  }
});

app.post('/notes', authenticateToken, async (req, res) => {
  try {
    const body = { ...req.body, userId: req.user.id };
    const validationError = validateNote(body);
    if (validationError) {
      return res.status(400).send(validationError);
    }
    const data = await db.addNote(body);
    res.send(data);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).send('Error creating note');
  }
});

app.get('/notes', authenticateToken, async (req, res) => {
  try {
    const { q, limit = 10, offset = 0 } = req.query;
    const data = q ? await db.getNotesByQuery(req.user.id, q, parseInt(limit), parseInt(offset)) : await db.getNotes(req.user.id, parseInt(limit), parseInt(offset));
    res.send(data);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).send('Error fetching notes');
  }
});

app.get('/notes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await db.getNoteById(id);
    if (!data) {
      res.status(404).send(`Note with id: (${id}) does not exist.`);
    } else if (data.userId.toString() !== req.user.id) {
      res.status(403).send('Access denied');
    } else {
      res.send(data);
    }
  } catch (error) {
    console.error('Error fetching note by id:', error);
    res.status(500).send('Error fetching note');
  }
});

// Health endpoint: quick check for server + DB
app.get('/health', async (req, res) => {
  try {
    // Try to ensure DB is connected; if not, ensureConnected will attempt reconnect
    await db.ensureConnected();
    res.json({ status: 'ok', db: true });
  } catch (e) {
    console.error('Health check failed:', e);
    res.status(503).json({ status: 'unavailable', db: false });
  }
});

app.put('/notes', authenticateToken, async (req, res) => {
  try {
    const validationError = validateNote(req.body);
    if (validationError) {
      return res.status(400).send(validationError);
    }
    if (!req.body._id) {
      return res.status(400).send('Note ID is required');
    }
    const existing = await db.getNoteById(req.body._id);
    if (!existing) {
      res.status(404).send(`Note with id: (${req.body._id}) does not exist.`);
    } else if (existing.userId.toString() !== req.user.id) {
      res.status(403).send('Access denied');
    } else {
      const data = await db.updateNote(req.body);
      res.send(data);
    }
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).send('Error updating note');
  }
});

app.delete('/notes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getNoteById(id);
    if (!existing) {
      res.status(404).send(`Note with id: (${id}) does not exist to delete.`);
    } else if (existing.userId.toString() !== req.user.id) {
      res.status(403).send('Access denied');
    } else {
      const data = await db.deleteNote(id);
      res.send(data);
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).send('Error deleting note');
  }
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    db.connect();
    console.log(`Server running on port ${PORT}.`);
  });
}

module.exports = { app, db };
