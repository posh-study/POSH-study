import { useState, useEffect } from "react";
import AuthView from "./components/AuthView.jsx";
import TodoView from "./components/TodoView.jsx";
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "./config.js";

// アプリのルート。ログイン状態に応じて画面を出し分ける。
export default function App() {
  const [user, setUser] = useState(null);

  // 再訪時にトークンが残っていればセッションを復元
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (savedUser && savedToken) setUser(savedUser);
    } catch {
      /* localStorage 使用不可でも起動できるように無視 */
    }
  }, []);

  const handleAuthenticated = ({ user: name, token }) => {
    try {
      if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, name);
    } catch { /* noop */ }
    setUser(name);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch { /* noop */ }
    setUser(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", color: "var(--color-text)",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "var(--space-6) var(--space-4)" }}>
      {user ? (
        <TodoView user={user} onLogout={handleLogout} />
      ) : (
        <AuthView onAuthenticated={handleAuthenticated} />
      )}
    </div>
  );
}
