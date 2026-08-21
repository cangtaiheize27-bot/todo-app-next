import { todayStr } from "../lib/todo-utils";

export default function StatsBar({ todos }) {
  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const active = total - completed;
  const overdue = todos.filter(
    (t) => !t.completed && t.dueDate && t.dueDate < todayStr()
  ).length;
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

  const categoryCounts = new Map();
  for (const t of todos) {
    if (!t.category) continue;
    categoryCounts.set(t.category, (categoryCounts.get(t.category) || 0) + 1);
  }

  return (
    <div className="stats">
      <div className="stats-tiles">
        <div className="stat-tile">
          <span className="stat-value">{total}</span>
          <span className="stat-label">合計</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{active}</span>
          <span className="stat-label">未完了</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{rate}%</span>
          <span className="stat-label">達成率</span>
        </div>
        <div className={`stat-tile ${overdue > 0 ? "is-alert" : ""}`}>
          <span className="stat-value">{overdue}</span>
          <span className="stat-label">期限切れ</span>
        </div>
      </div>
      {categoryCounts.size > 0 && (
        <div className="stats-categories">
          {Array.from(categoryCounts.entries()).map(([name, count]) => (
            <span key={name} className="stat-chip">
              {name} <b>{count}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
