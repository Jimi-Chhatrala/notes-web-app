# Notaty - Note-Taking Application

A full-stack note-taking application built with Node.js, Express, MongoDB, and vanilla JavaScript.

## Project Structure

```
notaty/
├── client/               # Frontend files
│   ├── notes.html       # Main HTML file
│   ├── note-client.js   # API client functions
│   ├── note-handler.js  # Note CRUD handler
│   ├── modal-handler.js # Modal UI handler
│   ├── css/             # Stylesheets
│   └── images/          # Images
├── server/              # Backend files
│   ├── server.js        # Express server
│   ├── database.js      # MongoDB database class
│   ├── package.json     # Dependencies
│   └── schemas/
│       └── note.js      # Mongoose Note schema
├── .env                 # Environment variables
└── .gitignore          # Git ignore rules
```

## Installation

1. **Install MongoDB**
   - Download from [mongodb.com](https://www.mongodb.com/try/download/community)
   - Start the MongoDB service

2. **Install Dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Configure Environment**
   - Edit `.env` file to change PORT, MONGODB_URL, JWT_SECRET, CORS_ORIGIN if needed

4. **Start the Server**
   ```bash
   npm start        # Production
   npm run start:dev # Development with auto-reload
   ```

5. **Open Client**
   - Open `client/notes.html` in your web browser
   - Or serve with a local server: `python -m http.server 8000` (in client directory)

## Features

- User registration and login with JWT authentication
- Create, read, update, delete notes
- Search notes by title
- Pagination for large note lists
- Responsive UI with modals
- Auto-retry for backend connectivity issues

## API Endpoints

- **POST /register** - Register a new user
- **POST /login** - Login user
- **POST /notes** - Create a new note (auth required)
- **GET /notes** - Get user's notes (auth required, supports ?title=search&limit=10&offset=0)
- **GET /notes?title=keyword** - Search user's notes by title
- **GET /notes/:id** - Get a note by ID (auth required)
- **PUT /notes** - Update a note (auth required)
- **DELETE /notes/:id** - Delete a note (auth required)

## Recent Improvements

### Security
- ✅ Added JWT-based user authentication
- ✅ Fixed XSS vulnerability: Replaced `innerHTML` with `textContent` for user content
- ✅ Added server-side input validation (title & content length checks, user credentials)
- ✅ Sanitized error responses
- ✅ Protected all note endpoints with auth middleware

### Code Quality
- ✅ Converted database methods to async/await
- ✅ Removed unnecessary Promise wrapping
- ✅ Removed all debug console.log statements
- ✅ Removed commented-out dead code
- ✅ Improved error handling with consistent error messages
- ✅ Added response validation in client code
- ✅ Added ESLint configuration for code linting
- ✅ Added Jest tests for server routes

### Bug Fixes
- ✅ Fixed undefined `id` variable in PUT /notes endpoint
- ✅ Added proper server startup with `app.listen()`
- ✅ Ensured database connection is established on server start
- ✅ Fixed missing data validation in add/edit note flows
- ✅ Added ownership checks for note operations

### Configuration & DevOps
- ✅ Created `.env` file for environment configuration
- ✅ Created `.gitignore` to exclude node_modules and sensitive files
- ✅ Updated `package.json` with proper scripts and metadata
- ✅ Added dotenv support for configuration management
- ✅ Made BASE_URL dynamic (uses window.location.origin)
- ✅ Removed deprecated body-parser, using Express built-ins

### Performance
- ✅ Simplified async operations with cleaner async/await syntax
- ✅ Improved database method efficiency with { new: true } option in findByIdAndUpdate
- ✅ Added database indexes on userId and title for faster queries
- ✅ Implemented pagination for GET /notes to handle large datasets

### Features
- ✅ Added user registration and login
- ✅ Added pagination support (limit/offset)
- ✅ Added client-side auth checks and modals

## Error Handling

The application now provides:
- Clear validation error messages for invalid input
- Consistent HTTP status codes
- User-friendly error messages in modals
- Network error detection with fallback messages

## Notes

- MongoDB must be running for the application to work
- Default server port: 3000
- Ensure CORS is properly configured for cross-origin requests
- The HTML file uses inline onclick handlers (could be refactored to event listeners in future)

## Future Improvements

- [ ] Add password reset functionality
- [ ] Implement refresh token mechanism
- [ ] Add note categories/tags
- [ ] Add rich text editing
- [ ] Add export to PDF/Markdown functionality
- [ ] Implement rate limiting
- [ ] Add unit tests for client-side code
