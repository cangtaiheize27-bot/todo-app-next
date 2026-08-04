"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "todo-app:v1";

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Home() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("all"); // all | active | completed
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
    const todo = { id: newId(), text, completed: false };
    setTodos((prev) => [todo, ...prev]);
    setInput("");
    inputRef.current?.focus(); // 追加後もすぐ次を入力できるように
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTodo();
    }
  }

  function toggleTodo(id) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
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

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.length - activeCount;
  const progress = todos.length === 0 ? 0 : Math.round((completedCount / todos.length) * 100);

  const visible = todos.filter((t) =>
    filter === "active" ? !t.completed : filter === "completed" ? t.completed : true
  );

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

        {todos.length > 0 && (
          <nav className="filters" aria-label="表示の絞り込み">
            {[
              { key: "all", label: "すべて" },
              { key: "active", label: "未完了" },
              { key: "completed", label: "完了" },
            ].map((f) => (
              <button
                key={f.key}
                className={`filter ${filter === f.key ? "is-active" : ""}`}
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
              >
                {f.label}
              </button>
            ))}
          </nav>
        )}

        <section className="list-area">
          {!mounted ? (
            // 読み込み前は空状態を先に見せない（ちらつき防止）
            <div className="placeholder" />
          ) : visible.length === 0 ? (
            <EmptyState todosLength={todos.length} filter={filter} />
          ) : (
            <ul className="list">
              {visible.map((t) => (
                <li key={t.id} className={`item ${t.completed ? "is-done" : ""}`}>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={() => toggleTodo(t.id)}
                      aria-label={`${t.text} を完了にする`}
                    />
                    <span className="checkbox" aria-hidden="true" />
                    <span className="item-text">{t.text}</span>
                  </label>
                  <button
                    className="delete"
                    onClick={() => deleteTodo(t.id)}
                    aria-label={`${t.text} を削除`}
                    title="削除"
                  >
                    削除
                  </button>
                </li>
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
  } else {
    message = "完了したタスクはまだありません。";
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
