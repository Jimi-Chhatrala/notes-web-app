const mongoose = require('mongoose');

const Note = require('./schemas/note');
const User = require('./schemas/user');
class Database {
  constructor() {
    this.url = process.env.MONGODB_URL || 'mongodb://localhost:27017/notaty';
    this.connected = false;
    this.maxConnectAttempts = 5;
    this.initialRetryDelayMs = 1000; // 1s
  }

  async connect(attempt = 1) {
    const opts = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    };
    try {
      await mongoose.connect(this.url, opts);
      this.connected = true;
      console.log('Database connected.');
      // Create indexes
      await Note.createIndexes({ userId: 1, title: 1 });
      await User.createIndexes({ username: 1 });
    } catch (error) {
      this.connected = false;
      console.log(`Database connection attempt ${attempt} failed:`, error.message || error);
      if (attempt < this.maxConnectAttempts) {
        const delay = this.initialRetryDelayMs * Math.pow(2, attempt - 1);
        console.log(`Retrying to connect in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        return this.connect(attempt + 1);
      }
      console.log('Max DB connection attempts reached. Database unavailable.');
      throw error;
    }
  }

  async ensureConnected() {
    // mongoose.connection.readyState === 1 means connected
    if (this.connected || mongoose.connection.readyState === 1) {
      this.connected = true;
      return;
    }
    // Try to connect (may throw)
    await this.connect();
  }

  async addNote(note) {
    await this.ensureConnected();
    note.createdAt = new Date();
    note.updatedAt = new Date();
    const newNote = new Note(note);
    return await newNote.save();
  }

  async getNotes(userId, limit = 10, offset = 0) {
    await this.ensureConnected();
    return await Note.find({ userId }).limit(limit).skip(offset);
  }

  async getNoteById(id) {
    await this.ensureConnected();
    return await Note.findById(id);
  }

  async updateNote(note) {
    await this.ensureConnected();
    note.updatedAt = new Date();
    return await Note.findByIdAndUpdate(note._id, note, { returnDocument: 'after' });
  }

  async deleteNote(id) {
    await this.ensureConnected();
    return await Note.findByIdAndDelete(id);
  }

  async getNotesByQuery(userId, query, limit = 10, offset = 0) {
    await this.ensureConnected();
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'i');
    const dbQuery = { userId, $or: [{ title: regex }, { content: regex }, { category: regex }] };
    return await Note.find(dbQuery).limit(limit).skip(offset);
  }

  async createUser(user) {
    await this.ensureConnected();
    const newUser = new User(user);
    return await newUser.save();
  }

  async getUserByUsername(username) {
    await this.ensureConnected();
    return await User.findOne({ username });
  }
}

module.exports = Database;
