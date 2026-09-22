require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");
const app = express();

const client = new OpenAI({
    apiKey : process.env.AI_API_KEY
});

const PORT = 5000;

app.get("/ask-ai",async(req,res)=>{
    const response = await client.responses.create({
    model: "gpt-5",
    input: "What is Artificial Intelligence?"
    });
    res.json(response);
})

app.listen(PORT, () => {
    console.log(`ThinkAI server is listening on port ${PORT}`);
});