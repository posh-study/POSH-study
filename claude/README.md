# Todo（React版）

元のHTMLプロトタイプを **React (Vite)** に移植したものです。保存先を
**AWS RDS（Lambda経由）** に差し替える構成で、**APIのパスは後から `src/config.js`
に記入するだけ**で全画面が動くようにしてあります。

## 使い方

```bash
npm install
npm run dev      # 開発サーバ（http://localhost:5173）
npm run build    # 本番ビルド（dist/）
```

## ★ APIパスの設定（ここだけ埋めればOK）

`src/config.js` の `baseUrl` と各 `endpoints.*.path` を記入します。空のままだと
「API が未設定です」というエラーが画面に出るので、どこを埋めるべきか一目で分かります。

```js
export const API_CONFIG = {
  baseUrl: "https://xxxx.execute-api.ap-northeast-1.amazonaws.com/prod",
  endpoints: {
    register:   { method: "POST",   path: "/auth/register" },
    login:      { method: "POST",   path: "/auth/login" },
    listTodos:  { method: "GET",    path: "/todos" },
    addTodo:    { method: "POST",   path: "/todos" },
    toggleTodo: { method: "PATCH",  path: "/todos/:id" },
    deleteTodo: { method: "DELETE", path: "/todos/:id" },
  },
};
```

`baseUrl` は `.env` の `VITE_API_BASE_URL` でも上書きできます（`.env.example` 参照）。

## API仕様（フロントが期待する形）

| 操作 | メソッド | パス例 | リクエスト | レスポンス |
|------|----------|--------|-----------|-----------|
| 新規登録 | POST | `/auth/register` | `{ name, password }` | `{ user, token }` |
| ログイン | POST | `/auth/login` | `{ name, password }` | `{ user, token }` |
| 一覧取得 | GET | `/todos` | （なし） | `[{ id, text, done }, ...]` |
| 追加 | POST | `/todos` | `{ text }` | `{ id, text, done }` |
| 完了切替 | PATCH | `/todos/:id` | `{ done }` | `{ id, text, done }` |
| 削除 | DELETE | `/todos/:id` | （なし） | `{ ok: true }` |

- ログイン/新規登録で受け取った `token` は `localStorage` に保存し、以降のリクエストの
  `Authorization: Bearer <token>` に自動付与されます（`src/api/client.js`）。
- 認証まわりのロジックは `src/api/client.js` に集約されているので、トークン方式を
  変えたい場合もここだけ直せば済みます。

## バックエンド（AWS RDS + Lambda）

`backend/` に出発点となる雛形があります。

- `schema.sql` … RDS(MySQL)に流すテーブル定義（`users` / `todos`）
- `lambda-handler.mjs` … 6つのAPIを1つのLambdaで捌く例（API Gateway HTTP API 用）

構成の目安:

1. **RDS** … MySQL(またはPostgreSQL)インスタンスを作成し、`schema.sql` を実行。
2. **Lambda** … `lambda-handler.mjs` をデプロイ。`npm i mysql2 bcryptjs jsonwebtoken`。
   環境変数に `DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME / JWT_SECRET / CORS_ORIGIN` を設定。
   RDSと同じVPCに配置し、セキュリティグループでLambda→RDSの通信を許可。
3. **API Gateway (HTTP API)** … 上表のルートをLambdaに紐付け、CORSを有効化。
4. できあがったURLを `src/config.js` に記入。

### セキュリティ上の注意
- 元プロトタイプはパスワードを平文でブラウザに保存していましたが、本構成では
  **サーバ側でbcryptハッシュ化**し、平文はDBにもクライアントにも残しません。
- `JWT_SECRET` は十分に長いランダム値を使い、リポジトリにコミットしないでください。
- `CORS_ORIGIN` は本番では `*` ではなく実際のフロントのオリジンを指定してください。

## ディレクトリ構成

```
todo-react/
├─ index.html              # Google Fonts でデザインを再現
├─ package.json
├─ vite.config.js
├─ .env.example
├─ src/
│  ├─ config.js            # ★ APIパスをここに記入
│  ├─ main.jsx             # エントリ
│  ├─ App.jsx              # 認証状態と画面切替
│  ├─ styles.css           # 元のデザインシステムを移植
│  ├─ api/
│  │  └─ client.js         # 通信層（fetchラッパー）
│  └─ components/
│     ├─ AuthView.jsx      # ログイン/新規登録
│     ├─ TodoView.jsx      # Todo一覧・追加・完了・削除
│     └─ TodoItem.jsx      # Todo1件分
└─ backend/
   ├─ schema.sql           # RDSテーブル定義
   └─ lambda-handler.mjs   # Lambda雛形
```
