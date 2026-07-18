// ============================================================================
//  API クライアント
// ----------------------------------------------------------------------------
//  config.js のエンドポイント定義を使って Lambda(API Gateway) を呼び出す層。
//  画面側(App/TodoView)はここの関数だけを呼べばよく、通信の詳細を意識しない。
//
//  ・パスが未設定(空文字)のときは分かりやすい日本語エラーを投げる
//  ・認証トークンは Authorization: Bearer で自動付与
//  ・4xx/5xx はエラーとして throw（呼び出し側で catch）
// ============================================================================

import { API_CONFIG, TOKEN_STORAGE_KEY } from "../config.js";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

// エンドポイント定義 + パラメータ から実際のURL/メソッドを組み立てる
function resolve(endpointName, params = {}) {
  const ep = API_CONFIG.endpoints[endpointName];
  if (!ep) {
    throw new ApiError(`未知のエンドポイント: ${endpointName}`);
  }
  if (!API_CONFIG.baseUrl || !ep.path) {
    throw new ApiError(
      `API が未設定です（${endpointName}）。src/config.js の baseUrl と ` +
        `endpoints.${endpointName}.path を入力してください。`
    );
  }
  // :id などのパスパラメータを置換
  let path = ep.path;
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`:${key}`, encodeURIComponent(value));
  }
  const base = API_CONFIG.baseUrl.replace(/\/$/, "");
  return { url: base + path, method: ep.method };
}

async function request(endpointName, { params, body } = {}) {
  const { url, method } = resolve(endpointName, params);

  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError("サーバーに接続できませんでした。通信環境を確認してください。");
  }

  // 204 などボディなしにも対応
  const text = await res.text();
  const data = text ? safeParse(text) : null;

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `エラーが発生しました (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return data;
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ── 画面から呼ぶ公開関数 ─────────────────────────────────────────────
export const api = {
  register: (name, password) =>
    request("register", { body: { name, password } }),

  login: (name, password) =>
    request("login", { body: { name, password } }),

  listTodos: () => request("listTodos"),

  addTodo: (text) => request("addTodo", { body: { text } }),

  toggleTodo: (id, done) =>
    request("toggleTodo", { params: { id }, body: { done } }),

  deleteTodo: (id) => request("deleteTodo", { params: { id } }),
};

export { ApiError };
