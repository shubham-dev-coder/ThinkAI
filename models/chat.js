
const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  // Har conversation ko identify karega
  conversationId: {
    type: String,
    required: true,
    index: true,
  },

  // Chat kis user ki hai, uski ID store hogi
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  question: {
    type: String,
    required: true,
  },

  answer: {
    type: String,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const chat = mongoose.model("chat", chatSchema);

module.exports = chat;
