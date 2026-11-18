export function EmptyPage({ text }) {
  return (
    <div className="empty-page">
      <span>✦</span>
      <p>{text}</p>
    </div>
  );
}

export function BottomNav({ page, setPage }) {
  return (
    <nav className="bottom-nav">
      <button className={page === "team" ? "active" : ""} onClick={() => setPage("team")}>
        <span>◈</span>
        <small>Team Builder</small>
      </button>
      <button className={page === "moves" ? "active" : ""} onClick={() => setPage("moves")}>
        <span>✦</span>
        <small>Movimentos</small>
      </button>
      <button className={page === "battles" ? "active" : ""} onClick={() => setPage("battles")}>
        <span>⚔</span>
        <small>Batalhas</small>
      </button>
    </nav>
  );
}
