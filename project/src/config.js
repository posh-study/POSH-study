// ============================================================================
//  API 設定
// ----------------------------------------------------------------------------
//  各APIのパスがまだ未定なので、ここを後から埋めるだけで全画面が動くようにして
//  あります。Lambda(API Gateway)のURLが決まったら以下を記入してください。
//
//  ● baseUrl … API Gateway のベースURL（末尾スラッシュ不要）
//      例: "https://abcd1234.execute-api.ap-northeast-1.amazonaws.com/prod"
//
//  ● endpoints … 各操作のパス。{ method, path } で指定します。
//      path 内の :id はTodoのIDに実行時に置き換わります。
//
//  環境変数（Vite）で上書きも可能:  VITE_API_BASE_URL=...  を .env に置くと優先。
// ============================================================================

export const API_CONFIG = {
  // 例: "https://xxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod"
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "",

  endpoints: {
    // --- 認証 ---
    // body: { name, password }            -> { user, token }
    register:   { method: "POST",   path: "/auth/register" },   // 例: "/auth/register"
    // body: { name, password }            -> { user, token }
    login:      { method: "POST",   path: "/auth/login" },   // 例: "/auth/login"

    // --- Todo ---
    // GET                                 -> [{ id, text, done }, ...]
    listTodos:  { method: "GET",    path: "/todos" },   // 例: "/todos"
    // body: { text }                      -> { id, text, done }
    addTodo:    { method: "POST",   path: "/todos" },   // 例: "/todos"
    // body: { done }                      -> { id, text, done }
    toggleTodo: { method: "PATCH",  path: "/todos/:id" },   // 例: "/todos/:id"
    // (body なし)                          -> { ok: true }
    deleteTodo: { method: "DELETE", path: "/todos/:id" },   // 例: "/todos/:id"
  },
};

// 認証トークンをブラウザに保存するときのキー（セッション復元に使用）
export const TOKEN_STORAGE_KEY = "todoapp:token";
export const USER_STORAGE_KEY = "todoapp:user";
