import { useState } from "react";
import { api } from "../client.js";

// ログイン / 新規登録 画面。
// 認証成功時に onAuthenticated({ user, token }) を呼んで親に通知する。
export default function AuthView({ onAuthenticated }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === "register";

  const changeMode = (next) => {
    setMode(next);
    setError("");
    setPw("");
    setPw2("");
  };

  // 入力チェック（元プロトタイプと同じルール）
  const valid =
    name.trim() && pw.length >= 4 && (!isRegister || pw2.length >= 4);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return setError("お名前を入力してください");
    if (pw.length < 4) return setError("パスワードは4文字以上で入力してください");
    if (isRegister && pw !== pw2) return setError("パスワードが一致しません");

    setSubmitting(true);
    setError("");
    try {
      const result = isRegister
        ? await api.register(trimmed, pw)
        : await api.login(trimmed, pw);
      // 期待レスポンス: { user, token }
      onAuthenticated({ user: result.user ?? trimmed, token: result.token ?? null });
    } catch (e) {
      setError(e.message || "認証に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && valid && !submitting) submit();
  };

  return (
    <div style={{ width: "100%", maxWidth: 400, margin: "auto", display: "flex",
      flexDirection: "column", gap: "var(--space-6)", padding: "var(--space-8) 0" }}>

      {/* ヘッダー */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", textAlign: "center" }}>
        <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-accent)", color: "var(--color-accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-heading)", fontWeight: "var(--font-heading-weight)",
          fontSize: 26, margin: "0 auto" }}>T</div>
        <h1 style={{ margin: "var(--space-2) 0 0", fontSize: 38 }}>Todo</h1>
        <p className="text-muted" style={{ margin: 0 }}>
          {isRegister ? "アカウントを新規登録" : "ログインして始めましょう"}
        </p>
      </div>

      {/* フォーム */}
      <div className="card" style={{ padding: "var(--space-4)", gap: "var(--space-4)" }}>
        <div className="seg" style={{ alignSelf: "stretch" }}>
          <label className="seg-opt" style={{ flex: 1, justifyContent: "center" }}>
            <input type="radio" name="authmode" checked={!isRegister}
              onChange={() => changeMode("login")} />ログイン
          </label>
          <label className="seg-opt" style={{ flex: 1, justifyContent: "center" }}>
            <input type="radio" name="authmode" checked={isRegister}
              onChange={() => changeMode("register")} />新規登録
          </label>
        </div>

        <div className="field">
          <label>お名前</label>
          <input className="input" type="text" value={name}
            onInput={(e) => { setName(e.target.value); setError(""); }}
            onKeyDown={onKey} placeholder="例：田中 太郎" />
        </div>

        <div className="field">
          <label>パスワード</label>
          <input className="input" type="password" value={pw}
            onInput={(e) => { setPw(e.target.value); setError(""); }}
            onKeyDown={onKey} placeholder="4文字以上" />
        </div>

        {isRegister && (
          <div className="field">
            <label>パスワード（確認）</label>
            <input className="input" type="password" value={pw2}
              onInput={(e) => { setPw2(e.target.value); setError(""); }}
              onKeyDown={onKey} placeholder="もう一度入力" />
          </div>
        )}

        {error && (
          <div style={{ fontSize: 13, color: "var(--color-accent-800)",
            background: "var(--color-accent-100)", border: "1px solid var(--color-accent)",
            borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-3)",
            lineHeight: 1.5 }}>{error}</div>
        )}

        <button className="btn btn-primary btn-block" onClick={submit}
          disabled={!valid || submitting}>
          {submitting ? "処理中…" : isRegister ? "登録する" : "ログイン"}
        </button>
      </div>

      <p className="text-muted" style={{ margin: 0, fontSize: 12, textAlign: "center", lineHeight: 1.6 }}>
        アカウントごとにTodoが保存されます
      </p>
    </div>
  );
}
