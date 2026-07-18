-- ============================================================================
--  AWS RDS (MySQL) テーブル定義
--  RDS に接続して一度だけ実行してください。
--  PostgreSQL を使う場合は AUTO_INCREMENT を SERIAL、DATETIME を TIMESTAMPTZ に
--  読み替えてください。
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(191) NOT NULL UNIQUE,   -- ログイン名（画面の「お名前」）
  password_hash VARCHAR(255) NOT NULL,          -- bcryptハッシュ（平文は絶対に保存しない）
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS todos (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT NOT NULL,
  text       TEXT NOT NULL,
  done       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_todos_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- ユーザーごとの一覧取得を速くするためのインデックス
CREATE INDEX idx_todos_user ON todos (user_id, created_at DESC);
