// Todo 1件分の行。表示のみ（状態は持たない）。
export default function TodoItem({ text, done, onToggle, onDelete }) {
  const checkStyle = {
    flexShrink: 0,
    width: "24px",
    height: "24px",
    padding: 0,
    borderRadius: "var(--radius-sm)",
    border: "1.5px solid " + (done ? "var(--color-accent)" : "var(--color-divider)"),
    background: done ? "var(--color-accent-100)" : "transparent",
    color: "var(--color-accent)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const checkIconStyle = {
    display: "flex",
    opacity: done ? 1 : 0,
    transition: "opacity 0.12s ease",
  };
  const textStyle = {
    flex: 1,
    fontSize: "15px",
    lineHeight: 1.45,
    wordBreak: "break-word",
    color: done ? "var(--color-neutral-500)" : "var(--color-text)",
    textDecoration: done ? "line-through" : "none",
  };

  return (
    <div
      className="card"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "var(--space-3)",
        animation: "itemIn 0.18s ease",
      }}
    >
      <button onClick={onToggle} aria-label="完了切り替え" style={checkStyle}>
        <span style={checkIconStyle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
      </button>

      <span style={textStyle}>{text}</span>

      <button className="btn btn-ghost btn-icon" onClick={onDelete} aria-label="削除"
        style={{ color: "var(--color-neutral-600)" }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          <line x1="10" x2="10" y1="11" y2="17" />
          <line x1="14" x2="14" y1="11" y2="17" />
        </svg>
      </button>
    </div>
  );
}
