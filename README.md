# ThinkAI — AI-Powered Personal Assistant

ThinkAI is a full-stack AI-powered chat application that allows users to interact with an AI assistant, manage conversations, and access their chat history through an authenticated account.

The project demonstrates full-stack development, AI API integration, session-based authentication, database management, and cloud deployment.

**Live Demo:** [Try ThinkAI](https://thinkai-frontend-8lw9.onrender.com)  
**Backend:** [ThinkAI API](https://thinkai-backend-jewk.onrender.com)  
**Source Code:** [GitHub Repository](https://github.com/shubham-dev-coder/ThinkAI)

---

## ✨ Features

- **AI-Powered Conversations:** Interact with an AI assistant through a chat interface.
- **User Authentication:** Sign up and log in with an individual account.
- **Session Management:** Maintain authenticated sessions across requests.
- **Protected Routes:** Restrict protected functionality to authenticated users.
- **Personal Chat History:** Store and access conversations associated with the logged-in user.
- **Chat Deletion:** Delete conversations when they are no longer needed.
- **User Data Isolation:** Keep each user's chat history separate from other users' data.
- **Responsive Interface:** Access the application through a modern web interface.
- **Cloud Deployment:** Frontend and backend are deployed separately.

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- JavaScript
- HTML5
- CSS3

### Backend
- Node.js
- Express.js
- REST API
- Session-based authentication
- CORS

### Database
- MongoDB
- MongoDB Atlas
- Mongoose

### AI Integration
- Groq API

### Tools & Deployment
- Git and GitHub
- Render
- Environment variables using dotenv

## 🏗️ Architecture

ThinkAI follows a client-server architecture.

```text
             User
               |
               v
       React Frontend
          (Vite)
               |
         HTTP Requests
               |
               v
       Express Backend
               |
       +-------+-------+
       |       |       |
       v       v       v
 Authentication MongoDB Groq API
       |       |       |
       +-------+-------+
               |
               v
        AI Response
               |
               v
       React Frontend
```

### How It Works

1. A user creates an account or logs in.
2. The backend authenticates the user and manages their session.
3. The frontend sends chat requests to the Express backend.
4. The backend communicates with the AI provider and processes the response.
5. Conversation data is stored and retrieved from MongoDB.
6. The AI response is returned to the frontend and displayed in the chat interface.

## 🚀 Getting Started

Follow these steps to run ThinkAI locally.

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/)
- npm
- A MongoDB database or MongoDB Atlas connection
- A Groq API key

### 1. Clone the Repository

```bash
git clone https://github.com/shubham-dev-coder/ThinkAI.git
cd ThinkAI
```

### 2. Install Backend Dependencies

From the project root:

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root.

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
SESSION_SECRET=your_secure_session_secret
FRONTEND_ORIGIN=http://localhost:5173
```

Replace the placeholder values with your own credentials. Never commit your `.env` file or expose API keys in frontend code.

### 4. Install Frontend Dependencies

```bash
cd client
npm install
```

Create `client/.env` if your frontend code uses the `VITE_API_URL` environment variable:

```env
VITE_API_URL=http://localhost:5000
```

Ensure the frontend API requests use the configured backend URL for this setting to take effect.

### 5. Run the Application

Start the backend from the project root:

```bash
npm run dev
```

If the project does not define a `dev` script, use the start command configured in the root `package.json`.

In a separate terminal, start the frontend:

```bash
cd client
npm run dev
```

Open the local URL printed by Vite in your terminal.

## 🔐 Security Considerations

- Keep API keys and database credentials in environment variables.
- Use server-side authentication checks for protected endpoints.
- Associate conversations with the authenticated user's account.
- Configure CORS to allow the intended frontend origin.
- Use secure cookie settings when deploying over HTTPS.
- Avoid logging passwords, session secrets, or API credentials.

## 🌐 Live Deployment

| Component | URL |
|---|---|
| Frontend | [ThinkAI Web App](https://thinkai-frontend-8lw9.onrender.com) |
| Backend | [ThinkAI Backend](https://thinkai-backend-jewk.onrender.com) |
| Source Code | [GitHub](https://github.com/shubham-dev-coder/ThinkAI) |

*Note: The backend may take a little time to respond after a period of inactivity, depending on the hosting service.*

## 📚 Key Learning Outcomes

Building ThinkAI provided practical experience with:

- Developing a full-stack application using React and Node.js.
- Building and integrating REST APIs.
- Implementing authentication and session management.
- Connecting a backend application to MongoDB.
- Integrating an external generative AI API.
- Managing environment variables and sensitive credentials.
- Deploying frontend and backend services separately.
- Managing code changes with Git and GitHub.

## 🔮 Future Improvements

Potential enhancements include:

- Streaming AI responses.
- Improved chat search and organization.
- More robust automated testing.
- Better rate limiting and usage monitoring.
- Enhanced accessibility and user experience.

## 👨‍💻 Developer

**Shubham Singh**  
Computer Science Engineering Student | Full-Stack Developer

GitHub: [shubham-dev-coder](https://github.com/shubham-dev-coder)

---

*ThinkAI is a learning and portfolio project built to demonstrate full-stack development and generative AI integration.*
