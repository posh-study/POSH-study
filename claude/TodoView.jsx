import { useState, useEffect } from "react";
import { api } from "../api/client.js";
import TodoItem from "./TodoItem.jsx";

// ログイン後のメイン画面。Todoの取得・追加・完了・削除をAPI経由で行う。
export default function TodoView({ user, onLogout }) {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 初回に一覧を取得
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await api.listTodos();
        if (alive) setTodos(Array.isArray(list) ? list : []);
      } catch (e) {
        if (alive) setError(e.message || "Todoの取得に失敗しました");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const add = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setError("");
    try {
      const created = await api.addTodo(text); // 期待: { id, text, done }
      setTodos((prev) => [created, ...prev]);
    } catch (e) {
      setError(e.message || "追加に失敗しました");
      setInput(text); // 失敗したら入力を戻す
    }
  };

  const toggle = async (id) => {
    const target = todos.find((t) => t.id === id);
    if (!target) return;
    const nextDone = !target.done;
    // 楽観的更新
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: nextDone } : t)));
    try {
      await api.toggleTodo(id, nextDone);
    } catch (e) {
      // 失敗したら元に戻す
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !nextDone } : t)));
      setError(e.message || "更新に失敗しました");
    }
  };

  const remove = async (id) => {
    const prev = todos;
    setTodos((cur) => cur.filter((t) => t.id !== id)); // 楽観的削除
    try {
      await api.deleteTodo(id);
    } catch (e) {
      setTodos(prev); // 失敗したら戻す
      setError(e.message || "削除に失敗しました");
    }
  };

  const onTodoKey = (e) => { if (e.key === "Enter") add(); };
  const activeCount = todos.filter((t) => !t.done).length;
  const userInitial = (user || "?").trim().charAt(0);

  return (
    <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

      {/* ヘッダー */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "var(--space-3)", padding: "var(--space-2) 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", minWidth: 0 }}>
          <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-accent)", color: "var(--color-accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-heading)", fontWeight: "var(--font-heading-weight)", fontSize: 20 }}>
            {userInitial}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: "var(--font-heading-weight)",
              fontSize: 20, lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user}
            </div>
            <div className="text-muted" style={{ fontSize: 12 }}>さんのTodo</div>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={onLogout}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          ログアウト
        </button>
      </header>

      <hr className="hr" style={{ margin: 0 }} />

      {/* 入力欄 */}
      <div style={{ display: "flex", gap: "var(--space-2)" }}>
        <input className="input" type="text" value={input}
          onInput={(e) => setInput(e.target.value)} onKeyDown={onTodoKey}
          placeholder="新しいタスクを入力…" style={{ flex: 1, minWidth: 0 }} />
        <button className="btn btn-primary" onClick={add} disabled={!input.trim()}
          style={{ flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="M12 5v14" />
          </svg>
          追加
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <div className="text-muted" style={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
          残り {activeCount} 件
        </div>
      </div>

      {error && (
        <div style={{ fontSize: 13, color: "var(--color-accent-800)",
          background: "var(--color-accent-100)", border: "1px solid var(--color-accent)",
          borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-3)" }}>{error}</div>
      )}

      {/* 一覧 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {loading ? (
          <div className="card" style={{ textAlign: "center", alignItems: "center",
            padding: "var(--space-8) var(--space-4)" }}>
            <div className="text-muted" style={{ fontSize: 13 }}>読み込み中…</div>
          </div>
        ) : todos.length === 0 ? (
          <div className="card" style={{ textAlign: "center", alignItems: "center",
            padding: "var(--space-8) var(--space-4)", gap: "var(--space-1)" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: "var(--font-heading-weight)", fontSize: 18 }}>
              タスクはまだありません
            </div>
            <div className="text-muted" style={{ fontSize: 13 }}>上の入力欄から追加しましょう</div>
          </div>
        ) : (
          todos.map((t) => (
            <TodoItem key={t.id} text={t.text} done={t.done}
              onToggle={() => toggle(t.id)} onDelete={() => remove(t.id)} />
          ))
        )}
      </div>

      <hr className="hr" style={{ margin: "var(--space-2) 0 0" }} />
      <div className="text-muted" style={{ textAlign: "center", fontSize: 11 }}>
        保存先：AWS RDS（Lambda経由）
      </div>
    </div>
  );
}
