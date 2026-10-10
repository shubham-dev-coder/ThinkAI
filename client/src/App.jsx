
import { useState, useRef, useEffect } from "react";
import { Sparkles } from "lucide-react";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);

  const chatEndRef = useRef(null);

  // Automatically scroll to the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // Fetch saved chats from MongoDB
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch("http://localhost:5000/chats");

        if (!response.ok) {
          throw new Error("Failed to fetch chats");
        }

        const data = await response.json();
        setRecentChats(data);
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };

    fetchChats();
  }, []);

  // Start a new chat without deleting saved chats
  const startNewChat = () => {
    setMessages([]);
    setQuestion("");
    setSelectedChatId(null);
  };

  // Open a saved question and answer
  const openRecentChat = (chat) => {
    setSelectedChatId(chat._id);

    setMessages([
      {
        role: "user",
        content: chat.question,
      },
      {
        role: "ai",
        content: chat.answer,
      },
    ]);

    setQuestion("");
  };

  // Ask ThinkAI a question
  const askAI = async () => {
    if (!question.trim() || loading) return;

    const currentQuestion = question.trim();

    // If a saved item is open, start a separate Q&A
    const isNewChat = selectedChatId !== null;

    setLoading(true);
    setQuestion("");
    setSelectedChatId(null);

    const userMessage = {
      role: "user",
      content: currentQuestion,
    };

    if (isNewChat) {
      setMessages([userMessage]);
    } else {
      setMessages((prevMessages) => [
        ...prevMessages,
        userMessage,
      ]);
    }

    try {
      const response = await fetch(
        `http://localhost:5000/ask-ai?question=${encodeURIComponent(
          currentQuestion
        )}`
      );

      if (!response.ok) {
        throw new Error("Failed to get an AI response");
      }

      const data = await response.json();

      // Display the AI answer
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "ai",
          content: data.answer,
        },
      ]);

      // Add the new Q&A to the top of Recents
      const newChat = {
        _id: `local-${Date.now()}`,
        question: currentQuestion,
        answer: data.answer,
      };

      setRecentChats((prevChats) => [
        newChat,
        ...prevChats,
      ]);

      setSelectedChatId(newChat._id);
    } catch (error) {
      console.error("Error asking ThinkAI:", error);

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "ai",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      {/* Left Sidebar */}
      <aside className="sidebar">
        <h2>✨ ThinkAI</h2>

        <button
          className="new-chat-button"
          onClick={startNewChat}
        >
          + New Chat
        </button>

        <h3>Recents</h3>

        <div className="recent-chats-list">
          {recentChats.length === 0 ? (
            <div className="recent-chat">
              No saved chats yet
            </div>
          ) : (
            recentChats.map((chat) => (
              <div
                key={chat._id}
                className={
                  selectedChatId === chat._id
                    ? "recent-chat active"
                    : "recent-chat"
                }
                title={chat.question}
                onClick={() => openRecentChat(chat)}
              >
                {chat.question}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="main-content">
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

          {loading && (
            <div className="ai-message">
              <div className="message-label">ThinkAI</div>
              <div className="message-content">
                ThinkAI is thinking...
              </div>
            </div>
          )}

          <div ref={chatEndRef}></div>
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="Ask your question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") askAI();
            }}
          />

          <button onClick={askAI} disabled={loading}>
            {loading ? "Thinking..." : "Ask AI"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
