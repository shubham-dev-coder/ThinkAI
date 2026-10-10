const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
    question: {
        type:String,
        required: true
    },

    answer: {
        type:String,
        required:true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

const chat = mongoose.model("chat",chatSchema);
module.exports=chat;