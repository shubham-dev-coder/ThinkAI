// dns server setting
const dns = require("dns");
dns.setServers(["8.8.8.8"]);

// Loads environment variables from the .env file
require("dotenv").config();

// Import the Chat model to perform database operations
const chat = require("./models/chat");

//Require mongoose
const mongoose= require("mongoose");

mongoose.connect(process.env.MONGODB_URI)
.then(()=>{
    console.log("MongoDB Connected")
}).catch((err)=>{
    console.log("MongoDB connection error",err);
});

// Imports Express framework
const express = require("express");

// Imports CORS middleware
const cors = require("cors");

// Imports Groq AI SDK
const Groq = require("groq-sdk");

// Creates an Express application
const app = express();

// Parses JSON data sent by the frontend
app.use(express.json());

// Imports the User model
const User = require("./models/User");

// require bcrypt
const bcrypt = require("bcrypt");

// Allows frontend to communicate with backend
app.use(cors());

// Creates a Groq client using the API key stored in .env
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Port on which our ThinkAI backend server will run
const PORT = 5000;

// Signup route - creates a new user account
app.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (typeof username !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string") {
            return res.status(400).json({
                message: "Invalid input"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await User.create({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword
        });

        res.status(201).json({
            message: "Signup successful",
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Username or email already exists"
            });
        }

        console.error("Signup error:", error);

        res.status(500).json({
            message: "Signup failed"
        });
    }
});


// API route for asking an AI question
app.get("/ask-ai", async (req, res) => {

    const question = req.query.question;

    // Sends a request to Groq
    const response = await groq.chat.completions.create({

        // Specifies the AI model
        model: "openai/gpt-oss-20b",

        // Sends the user's prompt to Groq
        messages: [

            {
              role: "system",
              content:
                  "You are ThinkAI, an AI assistant created for this application. Your name is ThinkAI. Never identify yourself as ChatGPT."
            },
            
            {
                role: "user",
                content: question
            }
        ]
    });

   // Store the AI-generated answer in a variable
   const answer = response.choices[0].message.content;

   // Save the question and answer in Mongo
     await chat.create({
        question:question,
        answer:answer
   });

   // Send the answer to the frontend
   res.json({
    answer:answer
   });
});

// API route to fetch previously saved chats
app.get("/chats",async (req,res)=>{
  const chats = await chat.find().sort({createdAt:-1});

  // Send the saved chats to the frontend
  res.json(chats);
})

// Starts the Express server
app.listen(PORT, () => {
    console.log(`ThinkAI server is listening on port ${PORT}`);
});