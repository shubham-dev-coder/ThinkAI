
import { useState, useRef, useEffect } from "react";
import { Sparkles } from "lucide-react";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);

  const chatEndRef = useRef(null);

  // New message aate hi chat automatically bottom par jayegi
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const askAI = async () => {
    if (!question.trim()) return;

    const currentQuestion = question;

    // User message
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        role: "user",
        content: currentQuestion,
      },
    ]);

    setQuestion("");

    const response = await fetch(
      `http://localhost:5000/ask-ai?question=${encodeURIComponent(
        currentQuestion
      )}`
    );

    const data = await response.json();

    // AI message
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        role: "ai",
        content: data.answer,
      },
    ]);
  };

  return (
    <>
      <h1>
        <Sparkles />
        ThinkAI
      </h1>

      <div className="chat-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={
              message.role === "user"
                ? "user-message"
                : "ai-message"
            }
          >
            <div className="message-label">
              {message.role === "user" ? "You" : "ThinkAI"}
            </div>

            <div className="message-content">
              {message.content}
            </div>
          </div>
        ))}

        {/* Always stays at the end of chat */}
        <div ref={chatEndRef}></div>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="Ask your question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        <button onClick={askAI}>Ask AI</button>
      </div>
    </>
  );
}

export default App;
