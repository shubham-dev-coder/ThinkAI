
const dns = require("dns");
dns.setServers(["8.8.8.8"]);

require("dotenv").config();

const chat = require("./models/chat");
const User = require("./models/User");

const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const Groq = require("groq-sdk");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 5000;

// Frontend origin; change this if Vite uses another port.
const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || "http://localhost:5173";

// Middleware
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Session configuration
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing from your .env file");
}

app.use(
  session({
    name: "thinkai.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
      ttl: 60 * 60 * 24,
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// Middleware to protect private routes
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      message: "Please log in to continue",
    });
  }

  next();
}

// ==============================
// SIGNUP
// ==============================
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (
      typeof username !== "string" ||
      !username.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Please provide valid signup details",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Signup successful",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Username or email already exists",
      });
    }

    console.error("Signup error:", error);

    return res.status(500).json({
      message: "Signup failed",
    });
  }
});

// ==============================
// LOGIN
// ==============================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Prevent session fixation by creating a fresh session.
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).json({
          message: "Unable to create login session",
        });
      }

      req.session.userId = user._id.toString();

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save error:", saveError);
          return res.status(500).json({
            message: "Unable to save login session",
          });
        }

        return res.status(200).json({
          message: "Login successful",
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
          },
        });
      });
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed. Please try again.",
    });
  }
});

// ==============================
// CHECK CURRENT SESSION
// ==============================
app.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select(
      "username email"
    );

    if (!user) {
      return req.session.destroy(() => {
        res.status(401).json({
          message: "Please log in again",
        });
      });
    }

    return res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Session check error:", error);
    return res.status(500).json({
      message: "Unable to check login session",
    });
  }
});

// ==============================
// LOGOUT
// ==============================
app.post("/logout", requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({
        message: "Logout failed",
      });
    }

    res.clearCookie("thinkai.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.json({
      message: "Logged out successfully",
    });
  });
});

// ==============================
// ASK AI - LOGIN REQUIRED
// ==============================
app.post("/ask-ai", requireAuth, async (req, res) => {
  try {
    const { question, conversationId, history = [] } = req.body;

    if (
      typeof question !== "string" ||
      !question.trim() ||
      typeof conversationId !== "string" ||
      !conversationId.trim()
    ) {
      return res.status(400).json({
        message: "Question and conversation ID are required",
      });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            (message) =>
              message &&
              ["user", "assistant"].includes(message.role) &&
              typeof message.content === "string"
          )
          .slice(-10)
          .map((message) => ({
            role: message.role,
            content: message.content,
          }))
      : [];

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            "You are ThinkAI, an AI assistant created for this application. Your name is ThinkAI. Never identify yourself as ChatGPT.",
        },
        ...safeHistory,
        {
          role: "user",
          content: question.trim(),
        },
      ],
    });

    const answer = response.choices[0].message.content;

    await chat.create({
      conversationId: conversationId.trim(),
      question: question.trim(),
      answer,
      userId: req.session.userId,
    });

    return res.json({
      answer,
      conversationId: conversationId.trim(),
    });
  } catch (error) {
    console.error("Ask AI error:", error);

    return res.status(500).json({
      message: "Failed to get AI response",
    });
  }
});

// ==============================
// FETCH CURRENT USER'S CHATS
// ==============================
app.get("/chats", requireAuth, async (req, res) => {
  try {
    const savedChats = await chat
      .find({ userId: req.session.userId })
      .sort({ createdAt: -1 });

    const conversations = new Map();

    savedChats.forEach((item) => {
      const id = item.conversationId || `legacy-${item._id}`;

      if (!conversations.has(id)) {
        conversations.set(id, {
          _id: id,
          conversationId: item.conversationId || null,
          question: item.question,
          answer: item.answer,
          createdAt: item.createdAt,
          messages: [],
        });
      }

      const conversation = conversations.get(id);

      conversation.messages.unshift(
        { role: "user", content: item.question },
        { role: "ai", content: item.answer }
      );
    });

    return res.json(Array.from(conversations.values()));
  } catch (error) {
    console.error("Fetch chats error:", error);

    return res.status(500).json({
      message: "Failed to fetch chats",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`ThinkAI server is listening on port ${PORT}`);
});
