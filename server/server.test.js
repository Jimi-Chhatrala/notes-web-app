require('dotenv').config({ path: '../.env' });
const request = require('supertest');
const mongoose = require('mongoose');
const { app, db } = require('./server');

beforeAll(async () => {
  await db.connect();
  // Clean db
  await mongoose.connection.db.dropDatabase();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Auth Routes', () => {
  test('POST /register - should create a user', async () => {
    const response = await request(app)
      .post('/register')
      .send({ username: 'testuser', password: 'testpass' });
    expect(response.status).toBe(201);
  });

  test('POST /login - should return token', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: 'testuser', password: 'testpass' });
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });
});

describe('Note Routes', () => {
  let token;
  let noteId;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/login')
      .send({ username: 'testuser', password: 'testpass' });
    token = loginRes.body.token;
  });

  test('POST /notes - should create a note', async () => {
    const response = await request(app)
      .post('/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Note', content: 'Test Content' });
    expect(response.status).toBe(200);
    noteId = response.body._id;
  });

  test('GET /notes - should return notes', async () => {
    const response = await request(app)
      .get('/notes')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('PUT /notes - should update a note', async () => {
    const response = await request(app)
      .put('/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ _id: noteId, title: 'Updated Note', content: 'Updated Content' });
    expect(response.status).toBe(200);
  });

  test('DELETE /notes/:id - should delete a note', async () => {
    const response = await request(app)
      .delete(`/notes/${noteId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
  });
});