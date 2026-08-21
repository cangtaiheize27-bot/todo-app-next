export default function Toolbar({
  status,
  onStatusChange,
  sortKey,
  onSortChange,
  category,
  onCategoryChange,
  categories,
  search,
  onSearchChange,
}) {
  return (
    <div className="toolbar">
      <input
        className="toolbar-search"
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="タイトル・カテゴリ・タグで検索"
        aria-label="タスクを検索"
      />

      <div className="toolbar-row">
        <nav className="filters" aria-label="状態で絞り込み">
          {[
            { key: "all", label: "すべて" },
            { key: "active", label: "未完了" },
            { key: "completed", label: "完了" },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              className={`filter ${status === f.key ? "is-active" : ""}`}
              onClick={() => onStatusChange(f.key)}
              aria-pressed={status === f.key}
            >
              {f.label}
            </button>
          ))}
        </nav>

        <div className="toolbar-selects">
          <select
            className="toolbar-select"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            aria-label="カテゴリで絞り込み"
          >
            <option value="all">全カテゴリ</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            className="toolbar-select"
            value={sortKey}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="並べ替え"
          >
            <option value="created">登録順</option>
            <option value="priority">重要度順</option>
            <option value="due">期日順</option>
          </select>
        </div>
      </div>
    </div>
  );
}
