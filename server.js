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

// Allows frontend to communicate with backend
app.use(cors());

// Creates a Groq client using the API key stored in .env
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Port on which our ThinkAI backend server will run
const PORT = 5000;


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