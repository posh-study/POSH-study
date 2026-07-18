// ============================================================================
//  Lambda ハンドラ（雛形） — API Gateway (HTTP API) → RDS(MySQL)
// ----------------------------------------------------------------------------
//  6つのAPIを1つのLambdaで処理する例。これはあくまで出発点です。実運用では
//  認証(JWT)・入力バリデーション・エラーハンドリングを強化してください。
//
//  依存: mysql2, bcryptjs, jsonwebtoken
//      npm i mysql2 bcryptjs jsonwebtoken
//
//  環境変数（Lambdaのコンソール or IaCで設定）:
//    DB_HOST, DB_PORT(=3306), DB_USER, DB_PASSWORD, DB_NAME
//    JWT_SECRET   … トークン署名用の秘密鍵
//    CORS_ORIGIN  … フロントのオリジン（例: https://your-app.example.com / 開発中は *）
//
//  フロントの config.js に設定するパスの対応:
//    POST   /auth/register   -> register
//    POST   /auth/login      -> login
//    GET    /todos           -> listTodos
//    POST   /todos           -> addTodo
//    PATCH  /todos/{id}      -> toggleTodo
//    DELETE /todos/{id}      -> deleteTodo
// ============================================================================

import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// コネクションはLambda再利用のためハンドラ外で保持
let pool;
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectionLimit: 2,
      waitForConnections: true,
    });
  }
  return pool;
}

const CORS = {
  "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
};

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", ...CORS },
  body: JSON.stringify(body),
});

function signToken(user) {
  return jwt.sign({ uid: user.id, name: user.name }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
}

// Authorization: Bearer <token> を検証して user を返す
function requireAuth(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) throw { status: 401, message: "ログインが必要です" };
  try {
    return jwt.verify(token, process.env.JWT_SECRET); // { uid, name }
  } catch {
    throw { status: 401, message: "セッションが無効です。再度ログインしてください" };
  }
}

export const handler = async (event) => {
  // CORS プリフライト
  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  const method = event.requestContext?.http?.method;
  const path = event.rawPath || "";
  const body = event.body ? JSON.parse(event.body) : {};
  const db = getPool();

  try {
    // ── 認証: 新規登録 ──
    if (method === "POST" && path.endsWith("/auth/register")) {
      const { name, password } = body;
      if (!name?.trim() || !password || password.length < 4) {
        return json(400, { message: "入力内容を確認してください" });
      }
      const [dup] = await db.query("SELECT id FROM users WHERE name = ?", [name.trim()]);
      if (dup.length) return json(409, { message: "この名前は既に登録されています" });

      const hash = await bcrypt.hash(password, 10);
      const [res] = await db.query(
        "INSERT INTO users (name, password_hash) VALUES (?, ?)",
        [name.trim(), hash]
      );
      const user = { id: res.insertId, name: name.trim() };
      return json(201, { user: user.name, token: signToken(user) });
    }

    // ── 認証: ログイン ──
    if (method === "POST" && path.endsWith("/auth/login")) {
      const { name, password } = body;
      const [rows] = await db.query("SELECT * FROM users WHERE name = ?", [name?.trim()]);
      if (!rows.length) return json(404, { message: "アカウントが見つかりません。新規登録してください" });
      const ok = await bcrypt.compare(password || "", rows[0].password_hash);
      if (!ok) return json(401, { message: "パスワードが違います" });
      const user = { id: rows[0].id, name: rows[0].name };
      return json(200, { user: user.name, token: signToken(user) });
    }

    // ── ここから先は認証必須 ──
    const auth = requireAuth(event);

    // ── Todo 一覧 ──
    if (method === "GET" && path.endsWith("/todos")) {
      const [rows] = await db.query(
        "SELECT id, text, done FROM todos WHERE user_id = ? ORDER BY created_at DESC",
        [auth.uid]
      );
      // done を boolean に整形して返す
      return json(200, rows.map((r) => ({ id: r.id, text: r.text, done: !!r.done })));
    }

    // ── Todo 追加 ──
    if (method === "POST" && path.endsWith("/todos")) {
      const text = (body.text || "").trim();
      if (!text) return json(400, { message: "内容を入力してください" });
      const [res] = await db.query(
        "INSERT INTO todos (user_id, text, done) VALUES (?, ?, 0)",
        [auth.uid, text]
      );
      return json(201, { id: res.insertId, text, done: false });
    }

    // ── Todo 完了切替（/todos/{id}）──
    if (method === "PATCH" && /\/todos\/[^/]+$/.test(path)) {
      const id = path.split("/").pop();
      await db.query(
        "UPDATE todos SET done = ? WHERE id = ? AND user_id = ?",
        [body.done ? 1 : 0, id, auth.uid]
      );
      const [rows] = await db.query(
        "SELECT id, text, done FROM todos WHERE id = ? AND user_id = ?",
        [id, auth.uid]
      );
      if (!rows.length) return json(404, { message: "対象が見つかりません" });
      return json(200, { id: rows[0].id, text: rows[0].text, done: !!rows[0].done });
    }

    // ── Todo 削除（/todos/{id}）──
    if (method === "DELETE" && /\/todos\/[^/]+$/.test(path)) {
      const id = path.split("/").pop();
      await db.query("DELETE FROM todos WHERE id = ? AND user_id = ?", [id, auth.uid]);
      return json(200, { ok: true });
    }

    return json(404, { message: "該当するAPIがありません" });
  } catch (err) {
    if (err?.status) return json(err.status, { message: err.message });
    console.error(err);
    return json(500, { message: "サーバーエラーが発生しました" });
  }
};
