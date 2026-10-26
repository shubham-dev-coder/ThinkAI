
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
  const [deletingChatId, setDeletingChatId] = useState(null);

  const [page, setPage] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // Load only the logged-in user's conversations
  const fetchChats = async () => {
    try {
      const response = await fetch("http://localhost:5000/chats", {
        credentials: "include",
      });

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

  // Restore the user's session after refresh
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("http://localhost:5000/me", {
          credentials: "include",
        });

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

  // Start a new conversation
  const startNewChat = () => {
    setMessages([]);
    setQuestion("");
    setSelectedChatId(null);
  };

  // Open an existing conversation
  const openRecentChat = (chat) => {
    const chatId = chat.conversationId || chat._id;

    setSelectedChatId(chatId);

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

  // Delete an entire conversation
  const deleteChat = async (event, chatId) => {
    event.stopPropagation();

    if (deletingChatId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this conversation? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeletingChatId(chatId);

    try {
      const response = await fetch(
        `http://localhost:5000/chats/${encodeURIComponent(chatId)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        setCurrentUser(null);
        setRecentChats([]);
        setMessages([]);
        setSelectedChatId(null);
        setPage("login");

        throw new Error("Your session expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete conversation");
      }

      // Remove the deleted conversation from the sidebar
      setRecentChats((previousChats) =>
        previousChats.filter(
          (chat) => (chat.conversationId || chat._id) !== chatId
        )
      );

      // Clear the chat window if this conversation was open
      if (selectedChatId === chatId) {
        setMessages([]);
        setQuestion("");
        setSelectedChatId(null);
      }
    } catch (error) {
      console.error("Delete chat error:", error);
      window.alert(error.message || "Unable to delete chat. Please try again.");
    } finally {
      setDeletingChatId(null);
    }
  };

  // Send a question to ThinkAI
  const askAI = async () => {
    if (!question.trim() || loading) return;

    if (!currentUser) {
      setPage("login");
      return;
    }

    const currentQuestion = question.trim();
    const conversationId = selectedChatId || crypto.randomUUID();

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
      const response = await fetch("http://localhost:5000/ask-ai", {
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
      });

      const data = await response.json();

      if (response.status === 401) {
        setCurrentUser(null);
        setPage("login");
        throw new Error("Session expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to get AI response");
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
      const response = await fetch("http://localhost:5000/logout", {
        method: "POST",
        credentials: "include",
      });

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
      window.alert("Unable to log out. Please try again.");
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

        <button className="new-chat-button" onClick={startNewChat}>
          + New Chat
        </button>

        <button className="new-chat-button" onClick={handleLogout}>
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {chat.question}
                  </span>

                  <button
                    type="button"
                    title="Delete conversation"
                    aria-label={`Delete conversation: ${chat.question}`}
                    disabled={deletingChatId !== null}
                    onClick={(event) => deleteChat(event, chatId)}
                    style={{
                      flexShrink: 0,
                      border: "none",
                      borderRadius: "6px",
                      padding: "5px",
                      background: "transparent",
                      cursor:
                        deletingChatId === chatId ? "wait" : "pointer",
                      opacity: deletingChatId === chatId ? 0.6 : 1,
                    }}
                  >
                    {deletingChatId === chatId ? "..." : "🗑️"}
                  </button>
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
                message.role === "user" ? "user-message" : "ai-message"
              }
            >
              <div className="message-label">
                {message.role === "user" ? "You" : "ThinkAI"}
              </div>

              <div className="message-content">{message.content}</div>
            </div>
          ))}

          {loading && (
            <div className="ai-message">
              <div className="message-label">ThinkAI</div>
              <div className="message-content">ThinkAI is thinking...</div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="Ask your question..."
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") askAI();
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
