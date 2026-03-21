const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const crypto = require('crypto');
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: false }));

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
  if (note.content.length > 1000000) {
    return 'Content must be less than 1,000,000 characters';
  }
  return null;
}

// Helper function to validate user input
function validateUser(user) {
  if (!user.username || !user.username.trim()) {
    return 'Username is required';
  }
  if (!user.email || !user.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return 'Valid email is required';
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
    const { username, email, password } = req.body;
    const validationError = validateUser({ username, email, password });
    if (validationError) {
      return res.status(400).send(validationError);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.createUser({ username, email, password: hashedPassword });
    res.status(201).send({ message: 'User created' });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).send('Username or Email already exists');
    } else {
      console.error('Error creating user:', error);
      res.status(500).send('Error creating user');
    }
  }
});

app.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).send('Email is required');
    const user = await db.findUserByEmail(email);
    if (!user) return res.status(404).send('User not found');

    const token = crypto.randomBytes(20).toString('hex');
    const expiry = Date.now() + 3600000; // 1 hour

    await db.setResetToken(user._id, token, expiry);

    // In a real app, send email here. For now, log to console.
    const resetUrl = `http://localhost:5500/client/index.html?token=${token}`;
    console.log('\n---------------------------------');
    console.log('PASSWORD RESET REQUEST');
    console.log(`User: ${user.username}`);
    console.log(`URL: ${resetUrl}`);
    console.log('---------------------------------\n');

    res.send('Reset link sent to your email (check server console)');
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).send('Error processing request');
  }
});

app.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 6) {
      return res.status(400).send('Invalid input data');
    }
    const user = await db.findUserByResetToken(token);
    if (!user) return res.status(400).send('Invalid or expired token');

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.updatePassword(user._id, hashedPassword);

    res.send('Password reset successful');
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).send('Error resetting password');
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
    const { q, category, limit = 10, offset = 0, archived = 'false' } = req.query;
    const isArchived = archived === 'true';
    const data = q 
      ? await db.getNotesByQuery(req.user.id, q, parseInt(limit), parseInt(offset), category, isArchived) 
      : await db.getNotes(req.user.id, parseInt(limit), parseInt(offset), category, isArchived);
    res.send(data);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).send('Error fetching notes');
  }
});

app.get('/notes/shared', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const data = await db.getSharedNotes(req.user.id, parseInt(limit), parseInt(offset));
    res.send(data);
  } catch (error) {
    console.error('Error fetching shared notes:', error);
    res.status(500).send('Error fetching shared notes');
  }
});

app.get('/notes/export', authenticateToken, async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const notes = await db.getAllNotes(req.user.id);

    if (format === 'csv') {
      const headers = ['id', 'title', 'category', 'content', 'isPinned', 'isArchived', 'isPublic', 'createdAt', 'updatedAt'];
      const rows = notes.map(n => [
        n._id,
        `"${(n.title || '').replace(/"/g, '""')}"`,
        `"${(n.category || 'General').replace(/"/g, '""')}"`,
        `"${(n.content || '').replace(/"/g, '""').replace(/<[^>]*>?/gm, '')}"`, // Strip HTML for CSV
        n.isPinned,
        n.isArchived,
        n.isPublic,
        n.createdAt.toISOString(),
        n.updatedAt.toISOString()
      ].join(','));
      
      const csvContent = [headers.join(','), ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=notaty_export_${Date.now()}.csv`);
      return res.send(csvContent);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=notaty_export_${Date.now()}.json`);
    res.json(notes);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).send('Error exporting data');
  }
});

// Public read endpoint (No authentication required)
app.get('/notes/public/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await db.getNoteById(id);
    if (!data || !data.isPublic) {
      res.status(404).send('Note not found or not public');
    } else {
      res.send(data);
    }
  } catch (error) {
    console.error('Error fetching public note:', error);
    res.status(500).send('Error fetching public note');
  }
});

app.get('/notes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await db.getNoteById(id);
    if (!data) {
      res.status(404).send(`Note with id: (${id}) does not exist.`);
    } else {
      const isOwner = data.userId.toString() === req.user.id;
      const isShared = data.sharedWith.some(s => s.userId.toString() === req.user.id);
      
      if (!isOwner && !isShared && !data.isPublic) {
        res.status(403).send('Access denied');
      } else {
        res.send(data);
      }
    }
  } catch (error) {
    console.error('Error fetching note by id:', error);
    res.status(500).send('Error fetching note');
  }
});

app.get('/categories', authenticateToken, async (req, res) => {
  try {
    const data = await db.getUserCategories(req.user.id);
    res.send(data);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).send('Error fetching categories');
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

app.post('/notes/:id/share', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, permission } = req.body;
    const data = await db.shareNote(id, req.user.id, username, permission);
    res.send(data);
  } catch (error) {
    console.error('Error sharing note:', error);
    res.status(400).send(error.message);
  }
});

app.delete('/notes/:id/share/:username', authenticateToken, async (req, res) => {
  try {
    const { id, username } = req.params;
    const data = await db.revokeShare(id, req.user.id, username);
    res.send(data);
  } catch (error) {
    console.error('Error revoking share:', error);
    res.status(400).send(error.message);
  }
});

app.post('/notes/:id/public', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;
    const data = await db.updatePublicStatus(id, req.user.id, isPublic);
    res.send(data);
  } catch (error) {
    console.error('Error updating public status:', error);
    res.status(400).send(error.message);
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
    } else {
      const isOwner = existing.userId.toString() === req.user.id;
      const sharedEntry = existing.sharedWith.find(s => s.userId.toString() === req.user.id);
      const canEdit = isOwner || (sharedEntry && sharedEntry.permission === 'edit');

      if (!canEdit) {
        res.status(403).send('Access denied');
      } else {
        // Prevent shared users from changing ownership or sharing settings via PUT
        if (!isOwner) {
          delete req.body.userId;
          delete req.body.sharedWith;
          delete req.body.isPublic;
        }
        const data = await db.updateNote(req.body);
        res.send(data);
      }
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
