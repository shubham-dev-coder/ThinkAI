// Loads environment variables from the .env file
require("dotenv").config();

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

    // Sends Groq's generated text to the browser
    res.json({
        answer: response.choices[0].message.content
    });
});


// Starts the Express server
app.listen(PORT, () => {
    console.log(`ThinkAI server is listening on port ${PORT}`);
});