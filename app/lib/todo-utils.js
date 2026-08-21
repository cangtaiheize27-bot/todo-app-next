export const STORAGE_KEY = "todo-app:v2";
const OLD_STORAGE_KEY = "todo-app:v1";

export const PRIORITIES = [
  { value: "high", label: "高", order: 0 },
  { value: "medium", label: "中", order: 1 },
  { value: "low", label: "低", order: 2 },
];

export const RECURRENCES = [
  { value: "none", label: "なし" },
  { value: "daily", label: "毎日" },
  { value: "weekly", label: "毎週" },
  { value: "monthly", label: "毎月" },
];

export function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function priorityRank(priority) {
  const found = PRIORITIES.find((p) => p.value === priority);
  return found ? found.order : 1;
}

// ---- 日付ヘルパー ----

export function todayStr() {
  const d = new Date();
  return toDateStr(d);
}

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

export function addMonths(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setMonth(d.getMonth() + n);
  return toDateStr(d);
}

export function nextDueDate(dateStr, recurrence) {
  if (!dateStr) return null;
  if (recurrence === "daily") return addDays(dateStr, 1);
  if (recurrence === "weekly") return addDays(dateStr, 7);
  if (recurrence === "monthly") return addMonths(dateStr, 1);
  return null;
}

export function formatDue(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  const now = new Date();
  if (Number(y) === now.getFullYear()) return `${Number(m)}/${Number(d)}`;
  return `${y}/${Number(m)}/${Number(d)}`;
}

// 'overdue' | 'today' | 'soon' | null
export function dueStatus(dateStr, completed) {
  if (!dateStr || completed) return null;
  const today = todayStr();
  if (dateStr < today) return "overdue";
  if (dateStr === today) return "today";
  if (dateStr <= addDays(today, 3)) return "soon";
  return null;
}

// ---- 永続化 ----

export function normalizeTodo(partial) {
  return {
    id: partial.id || newId(),
    text: partial.text || "",
    completed: Boolean(partial.completed),
    priority: PRIORITIES.some((p) => p.value === partial.priority)
      ? partial.priority
      : "medium",
    category: typeof partial.category === "string" ? partial.category : "",
    dueDate: partial.dueDate || null,
    tags: Array.isArray(partial.tags) ? partial.tags.filter(Boolean) : [],
    recurrence: RECURRENCES.some((r) => r.value === partial.recurrence)
      ? partial.recurrence
      : "none",
    subtasks: Array.isArray(partial.subtasks)
      ? partial.subtasks
          .filter((s) => s && typeof s.text === "string")
          .map((s) => ({
            id: s.id || newId(),
            text: s.text,
            completed: Boolean(s.completed),
          }))
      : [],
    createdAt: typeof partial.createdAt === "number" ? partial.createdAt : Date.now(),
  };
}

export function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(normalizeTodo) : [];
    }
    // v1 からの移行（重要度などのフィールドが無い旧データを補完）
    const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
    if (oldRaw) {
      const parsed = JSON.parse(oldRaw);
      if (Array.isArray(parsed)) return parsed.map(normalizeTodo);
    }
    return [];
  } catch {
    return [];
  }
}

// ---- 並べ替え・絞り込み ----

export function sortTodos(todos, sortKey) {
  const compareBySort = (a, b) => {
    if (sortKey === "priority") {
      return priorityRank(a.priority) - priorityRank(b.priority);
    }
    if (sortKey === "due") {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
    }
    // created: 新しく追加したものを上に（既存の挙動を踏襲）
    return b.createdAt - a.createdAt;
  };

  const active = todos.filter((t) => !t.completed).sort(compareBySort);
  const done = todos.filter((t) => t.completed).sort(compareBySort);
  return [...active, ...done];
}

export function filterTodos(todos, { status, category, search }) {
  const q = search.trim().toLowerCase();
  return todos.filter((t) => {
    if (status === "active" && t.completed) return false;
    if (status === "completed" && !t.completed) return false;
    if (category !== "all" && t.category !== category) return false;
    if (q) {
      const haystack = [t.text, t.category, ...(t.tags || [])]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function uniqueCategories(todos) {
  const set = new Set(todos.map((t) => t.category).filter(Boolean));
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ja"));
}
