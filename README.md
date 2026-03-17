# Notaty - Modern Note-Taking & Collaboration Platform

Notaty is a full-stack, production-ready web application designed for seamless note management and real-time collaboration. Built with Node.js, Express, MongoDB, and a modern vanilla JS frontend.

## 🚀 Key Features

### 📝 Rich Text Editing (WYSIWYG)
- **Quill.js Integration**: Replace standard textareas with a professional word-processing experience.
- **Formatting**: Full support for Bold, Italics, Underline, Bullet/Numbered Lists, and Headers.
- **Image Support**: Paste high-resolution images directly into notes.

### 🤝 Advanced Collaboration
- **User Invitations**: Share notes with other registered users by their username.
- **Granular Permissions**:
  - **Read Only**: Invited users can view content but not change it.
  - **Can Edit**: Full collaborative editing rights for invited users.
- **Access Management**:
  - **Permission Toggles**: Switch between View/Edit permissions at any time.
  - **Revoke Access**: Instantly remove users from a shared note via the Share Modal.
- **Shared Dashboard**: Dedicated "Shared with me" sidebar category for easy access to collaborative work.

### 🔗 Public Shareable Links
- **One-Click Sharing**: Toggle "Public View" to generate a unique, shareable URL.
- **External Viewing**: Anyone with the link can view the note on a dedicated, distraction-free public page—no login required.
- **Responsive Layout**: Images and content automatically adapt to fit any screen size.

### 🛠️ Performance & Scalability
- **Infinite Scroll**: Utilizes `IntersectionObserver` for lazy-loading notes, ensuring a smooth experience even with thousands of entries.
- **High-Payload Support**: Backend configured to handle large image uploads (up to 50MB per request).
- **Efficient Search & Filtering**: Instant search by title/content and organization through dynamic categories.

### 🔒 Security First
- **Sanitized Rendering**: Uses `DOMPurify` on both the main dashboard and public view to prevent XSS attacks.
- **Permission Enforcement**: Robust backend checks ensure only owners can manage sharing, and only authorized users can edit or delete.
- **JWT Authentication**: Secure login and registration with hashed passwords.

## 🛠️ Tech Stack
- **Frontend**: HTML5, Vanilla CSS3 (Custom Design), JavaScript (ES6+), Quill.js, DOMPurify.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB with Mongoose ODM.
- **Auth**: JSON Web Tokens (JWT), Bcrypt.js.

## 🚦 Getting Started
1. **Prerequisites**: Ensure you have Node.js and MongoDB installed.
2. **Environment**: Configure `.env` with `MONGODB_URL` and `JWT_SECRET`.
3. **Installation**: Run `npm install` in the server directory.
4. **Run**: 
   - Start backend: `npm start` (usually port 3000)
   - Open `client/index.html` (via Live Server or similar).
