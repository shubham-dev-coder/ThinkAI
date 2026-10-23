
import { useState, useRef, useEffect } from "react";
import { Sparkles } from "lucide-react";
import Signup from "./signup";
import Login from "./Login";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);

  const [page, setPage] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // Load chats belonging to the logged-in user
  const fetchChats = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/chats",
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setRecentChats([]);
          return;
        }

        throw new Error("Failed to fetch conversations");
      }

      const data = await response.json();
      setRecentChats(data);
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  // Check whether the user still has a valid session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/me",
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          setCurrentUser(null);
          setRecentChats([]);
          setPage("login");
          return;
        }

        const data = await response.json();

        setCurrentUser(data.user);
        setPage("chat");

        await fetchChats();
      } catch (error) {
        console.error("Session check failed:", error);
        setCurrentUser(null);
        setRecentChats([]);
        setPage("login");
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const startNewChat = () => {
    setMessages([]);
    setQuestion("");
    setSelectedChatId(null);
  };

  // Open an existing conversation
  const openRecentChat = (chat) => {
    setSelectedChatId(chat.conversationId || chat._id);

    if (Array.isArray(chat.messages) && chat.messages.length > 0) {
      setMessages(chat.messages);
    } else {
      setMessages([
        { role: "user", content: chat.question },
        { role: "ai", content: chat.answer },
      ]);
    }

    setQuestion("");
  };

  // Send a question to ThinkAI
  const askAI = async () => {
    if (!question.trim() || loading) return;

    if (!currentUser) {
      setPage("login");
      return;
    }

    const currentQuestion = question.trim();
    const conversationId =
      selectedChatId || crypto.randomUUID();

    const previousMessages = messages.map((message) => ({
      role: message.role === "ai" ? "assistant" : "user",
      content: message.content,
    }));

    setMessages((previous) => [
      ...previous,
      { role: "user", content: currentQuestion },
    ]);

    setSelectedChatId(conversationId);
    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/ask-ai",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            question: currentQuestion,
            conversationId,
            history: previousMessages,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        setCurrentUser(null);
        setPage("login");
        throw new Error("Session expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to get AI response"
        );
      }

      setMessages((previous) => [
        ...previous,
        { role: "ai", content: data.answer },
      ]);

      await fetchChats();
    } catch (error) {
      console.error("Error asking ThinkAI:", error);

      setMessages((previous) => [
        ...previous,
        {
          role: "ai",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Log out and destroy the server-side session
  const handleLogout = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/logout",
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      setCurrentUser(null);
      setRecentChats([]);
      setMessages([]);
      setQuestion("");
      setSelectedChatId(null);
      setPage("login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Unable to log out. Please try again.");
    }
  };

  if (checkingSession) {
    return <div className="signup-page">Checking session...</div>;
  }

  if (page === "signup") {
    return (
      <div className="signup-page">
        <Signup
          onSignupSuccess={() => setPage("login")}
          onLoginClick={() => setPage("login")}
        />

        <button
          className="signup-back-button"
          onClick={() => setPage("login")}
        >
          ← Back to Login
        </button>
      </div>
    );
  }

  if (page === "login") {
    return (
      <div className="signup-page">
        <Login
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setMessages([]);
            setSelectedChatId(null);
            setPage("chat");
            fetchChats();
          }}
          onSignupClick={() => setPage("signup")}
        />

        <button
          className="signup-back-button"
          onClick={() => setPage("signup")}
        >
          Create an account
        </button>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2>✨ ThinkAI</h2>

        {currentUser && (
          <p className="welcome-user">
            Welcome, {currentUser.username}!
          </p>
        )}

        <button
          className="new-chat-button"
          onClick={startNewChat}
        >
          + New Chat
        </button>

        <button
          className="new-chat-button"
          onClick={handleLogout}
        >
          Logout
        </button>

        <h3>Recents</h3>

        <div className="recent-chats-list">
          {recentChats.length === 0 ? (
            <div className="recent-chat">No saved chats yet</div>
          ) : (
            recentChats.map((chat) => {
              const chatId = chat.conversationId || chat._id;

              return (
                <div
                  key={chatId}
                  className={
                    selectedChatId === chatId
                      ? "recent-chat active"
                      : "recent-chat"
                  }
                  title={chat.question}
                  onClick={() => openRecentChat(chat)}
                >
                  {chat.question}
                </div>
              );
            })
          )}
        </div>
      </aside>

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

          <div ref={chatEndRef} />
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
