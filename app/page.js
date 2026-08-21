"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import TodoItem from "./components/TodoItem";
import StatsBar from "./components/StatsBar";
import Toolbar from "./components/Toolbar";
import {
  STORAGE_KEY,
  PRIORITIES,
  loadTodos,
  newId,
  normalizeTodo,
  nextDueDate,
  sortTodos,
  filterTodos,
  uniqueCategories,
} from "./lib/todo-utils";

export default function Home() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newCategory, setNewCategory] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  const [status, setStatus] = useState("all"); // all | active | completed
  const [category, setCategory] = useState("all");
  const [sortKey, setSortKey] = useState("created");
  const [search, setSearch] = useState("");

  const [mounted, setMounted] = useState(false);
  const [recentlyDeleted, setRecentlyDeleted] = useState(null); // { item, index }

  const inputRef = useRef(null);
  const undoTimer = useRef(null);

  // 初回マウント時に localStorage から読み込む
  useEffect(() => {
    setTodos(loadTodos());
    setMounted(true);
    inputRef.current?.focus();
  }, []);

  // 変更のたびに localStorage へ保存（マウント後のみ）
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      // 保存できなくてもアプリは動かし続ける
    }
  }, [todos, mounted]);

  useEffect(() => {
    return () => clearTimeout(undoTimer.current);
  }, []);

  function addTodo() {
    const text = input.trim();
    if (!text) return; // 空文字は追加しない
    const todo = normalizeTodo({
      text,
      priority: newPriority,
      category: newCategory.trim(),
      dueDate: newDueDate || null,
    });
    setTodos((prev) => [todo, ...prev]);
    setInput("");
    setNewPriority("medium");
    setNewCategory("");
    setNewDueDate("");
    inputRef.current?.focus(); // 追加後もすぐ次を入力できるように
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTodo();
    }
  }

  function toggleTodo(id) {
    setTodos((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target) return prev;
      const willComplete = !target.completed;
      const updated = prev.map((t) =>
        t.id === id ? { ...t, completed: willComplete } : t
      );

      // 繰り返しタスクを完了させたら、次回分を自動で追加する
      if (willComplete && target.recurrence !== "none" && target.dueDate) {
        const nextDue = nextDueDate(target.dueDate, target.recurrence);
        const spawned = normalizeTodo({
          text: target.text,
          priority: target.priority,
          category: target.category,
          dueDate: nextDue,
          tags: target.tags,
          recurrence: target.recurrence,
          subtasks: target.subtasks.map((s) => ({ text: s.text, completed: false })),
        });
        return [spawned, ...updated];
      }
      return updated;
    });
  }

  function deleteTodo(id) {
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) return;
    const item = todos[index];
    setTodos((prev) => prev.filter((t) => t.id !== id));
    // 取り消し用に一時保存
    setRecentlyDeleted({ item, index });
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setRecentlyDeleted(null), 5000);
  }

  function undoDelete() {
    if (!recentlyDeleted) return;
    const { item, index } = recentlyDeleted;
    setTodos((prev) => {
      const next = [...prev];
      next.splice(Math.min(index, next.length), 0, item);
      return next;
    });
    setRecentlyDeleted(null);
    clearTimeout(undoTimer.current);
  }

  function clearCompleted() {
    setTodos((prev) => prev.filter((t) => !t.completed));
  }

  function saveTodo(id, patch) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function addSubtask(id, text) {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, subtasks: [...t.subtasks, { id: newId(), text, completed: false }] }
          : t
      )
    );
  }

  function toggleSubtask(id, subId) {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subId ? { ...s, completed: !s.completed } : s
              ),
            }
          : t
      )
    );
  }

  function deleteSubtask(id, subId) {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subId) }
          : t
      )
    );
  }

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.length - activeCount;
  const progress = todos.length === 0 ? 0 : Math.round((completedCount / todos.length) * 100);
  const categories = useMemo(() => uniqueCategories(todos), [todos]);

  const visible = useMemo(() => {
    const filtered = filterTodos(todos, { status, category, search });
    return sortTodos(filtered, sortKey);
  }, [todos, status, category, search, sortKey]);

  return (
    <main className="page">
      <div className="card">
        <header className="head">
          <div className="head-row">
            <h1 className="title">ToDo</h1>
            <span className="remaining">
              {activeCount === 0 && todos.length > 0 ? "すべて完了" : `残り ${activeCount}`}
            </span>
          </div>
          <div className="progress" aria-hidden="true">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </header>

        {mounted && todos.length > 0 && <StatsBar todos={todos} />}

        <div className="composer">
          <input
            ref={inputRef}
            className="composer-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="やることを入力して Enter"
            aria-label="新しいタスク"
            maxLength={200}
          />
          <button
            className="composer-add"
            onClick={addTodo}
            disabled={input.trim().length === 0}
          >
            追加
          </button>
        </div>

        <div className="composer-details">
          <select
            className="composer-select"
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value)}
            aria-label="新しいタスクの重要度"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                重要度: {p.label}
              </option>
            ))}
          </select>
          <input
            className="composer-select"
            type="text"
            list="category-suggestions"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="カテゴリ（任意）"
            aria-label="新しいタスクのカテゴリ"
          />
          <input
            className="composer-select"
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            aria-label="新しいタスクの期日"
          />
        </div>
        <datalist id="category-suggestions">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        {todos.length > 0 && (
          <Toolbar
            status={status}
            onStatusChange={setStatus}
            sortKey={sortKey}
            onSortChange={setSortKey}
            category={category}
            onCategoryChange={setCategory}
            categories={categories}
            search={search}
            onSearchChange={setSearch}
          />
        )}

        <section className="list-area">
          {!mounted ? (
            // 読み込み前は空状態を先に見せない（ちらつき防止）
            <div className="placeholder" />
          ) : visible.length === 0 ? (
            <EmptyState todosLength={todos.length} filter={status} />
          ) : (
            <ul className="list">
              {visible.map((t) => (
                <TodoItem
                  key={t.id}
                  todo={t}
                  categories={categories}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                  onSave={saveTodo}
                  onAddSubtask={addSubtask}
                  onToggleSubtask={toggleSubtask}
                  onDeleteSubtask={deleteSubtask}
                />
              ))}
            </ul>
          )}
        </section>

        {mounted && completedCount > 0 && (
          <footer className="foot">
            <span>{completedCount} 件 完了</span>
            <button className="clear" onClick={clearCompleted}>
              完了を削除
            </button>
          </footer>
        )}
      </div>

      {recentlyDeleted && (
        <div className="snackbar" role="status">
          <span>1件を削除しました</span>
          <button className="undo" onClick={undoDelete}>
            元に戻す
          </button>
        </div>
      )}
    </main>
  );
}

function EmptyState({ todosLength, filter }) {
  let message;
  if (todosLength === 0) {
    message = "まだタスクがありません。上の入力欄から追加しましょう。";
  } else if (filter === "active") {
    message = "未完了のタスクはありません。ひと段落ですね。";
  } else if (filter === "completed") {
    message = "完了したタスクはまだありません。";
  } else {
    message = "条件に一致するタスクがありません。";
  }
  return (
    <div className="empty">
      <div className="empty-mark" aria-hidden="true">
        ✓
      </div>
      <p className="empty-text">{message}</p>
    </div>
  );
}
