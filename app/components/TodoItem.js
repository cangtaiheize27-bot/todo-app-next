"use client";

import { useState } from "react";
import { PRIORITIES, RECURRENCES, dueStatus, formatDue } from "../lib/todo-utils";

const DUE_LABEL = { overdue: "期限切れ", today: "今日期限", soon: "期日が近い" };

export default function TodoItem({
  todo,
  categories,
  onToggle,
  onDelete,
  onSave,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [draft, setDraft] = useState(null);

  function startEdit() {
    setDraft({
      text: todo.text,
      priority: todo.priority,
      category: todo.category,
      dueDate: todo.dueDate || "",
      tags: (todo.tags || []).join(", "),
      recurrence: todo.recurrence,
    });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(null);
  }

  function saveEdit() {
    const text = draft.text.trim();
    if (!text) return;
    onSave(todo.id, {
      text,
      priority: draft.priority,
      category: draft.category.trim(),
      dueDate: draft.dueDate || null,
      tags: draft.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      recurrence: draft.recurrence,
    });
    setEditing(false);
    setDraft(null);
  }

  function addSubtask() {
    const text = subtaskInput.trim();
    if (!text) return;
    onAddSubtask(todo.id, text);
    setSubtaskInput("");
  }

  const status = dueStatus(todo.dueDate, todo.completed);
  const subtaskDone = (todo.subtasks || []).filter((s) => s.completed).length;
  const subtaskTotal = (todo.subtasks || []).length;

  if (editing) {
    return (
      <li className="item item-edit">
        <div className="edit-form">
          <input
            className="edit-input"
            type="text"
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            placeholder="タイトル"
            aria-label="タイトルを編集"
            autoFocus
          />
          <div className="edit-row">
            <select
              className="edit-select"
              value={draft.priority}
              onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
              aria-label="重要度"
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <input
              className="edit-input edit-input-sm"
              type="text"
              list="category-suggestions"
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              placeholder="カテゴリ"
              aria-label="カテゴリ"
            />
            <input
              className="edit-input edit-input-sm"
              type="date"
              value={draft.dueDate}
              onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
              aria-label="期日"
            />
          </div>
          <div className="edit-row">
            <input
              className="edit-input"
              type="text"
              value={draft.tags}
              onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
              placeholder="タグ（カンマ区切り）"
              aria-label="タグ"
            />
            <select
              className="edit-select"
              value={draft.recurrence}
              onChange={(e) => setDraft({ ...draft, recurrence: e.target.value })}
              aria-label="繰り返し"
            >
              {RECURRENCES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.value === "none" ? "繰り返しなし" : r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="edit-actions">
            <button type="button" className="edit-cancel" onClick={cancelEdit}>
              キャンセル
            </button>
            <button
              type="button"
              className="edit-save"
              onClick={saveEdit}
              disabled={!draft.text.trim()}
            >
              保存
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className={`item ${todo.completed ? "is-done" : ""} priority-${todo.priority}`}>
      <div className="item-main">
        <label className="check">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id)}
            aria-label={`${todo.text} を完了にする`}
          />
          <span className="checkbox" aria-hidden="true" />
          <span className={`priority-dot priority-dot-${todo.priority}`} title={`重要度: ${PRIORITIES.find((p) => p.value === todo.priority)?.label}`} />
        </label>

        <div className="item-body">
          <div className="item-title-row">
            <span className="item-text">{todo.text}</span>
            {todo.recurrence !== "none" && (
              <span className="badge badge-recur" title="繰り返しタスク">
                ↻ {RECURRENCES.find((r) => r.value === todo.recurrence)?.label}
              </span>
            )}
            {status && (
              <span className={`badge badge-due badge-due-${status}`}>
                {DUE_LABEL[status]}
              </span>
            )}
          </div>

          <div className="item-meta">
            {todo.category && <span className="meta-category">{todo.category}</span>}
            {todo.dueDate && <span className="meta-date">📅 {formatDue(todo.dueDate)}</span>}
            {(todo.tags || []).map((tag) => (
              <span key={tag} className="meta-tag">
                #{tag}
              </span>
            ))}
            {subtaskTotal > 0 && (
              <button
                type="button"
                className="meta-subtasks"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
              >
                ☑ {subtaskDone}/{subtaskTotal}
              </button>
            )}
          </div>
        </div>

        <div className="item-actions">
          <button type="button" className="icon-btn" onClick={startEdit} aria-label={`${todo.text} を編集`} title="編集">
            編集
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setExpanded((v) => !v)}
            aria-label="サブタスクを表示"
            aria-expanded={expanded}
            title="サブタスク"
          >
            {expanded ? "▲" : "▼"}
          </button>
          <button
            type="button"
            className="delete"
            onClick={() => onDelete(todo.id)}
            aria-label={`${todo.text} を削除`}
            title="削除"
          >
            削除
          </button>
        </div>
      </div>

      {expanded && (
        <div className="subtasks">
          {(todo.subtasks || []).map((s) => (
            <label key={s.id} className="subtask">
              <input
                type="checkbox"
                checked={s.completed}
                onChange={() => onToggleSubtask(todo.id, s.id)}
              />
              <span className={s.completed ? "subtask-done" : ""}>{s.text}</span>
              <button
                type="button"
                className="subtask-delete"
                onClick={(e) => {
                  e.preventDefault();
                  onDeleteSubtask(todo.id, s.id);
                }}
                aria-label={`${s.text} を削除`}
              >
                ×
              </button>
            </label>
          ))}
          <div className="subtask-add">
            <input
              type="text"
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSubtask();
                }
              }}
              placeholder="サブタスクを追加"
              aria-label="サブタスクを追加"
            />
            <button type="button" onClick={addSubtask} disabled={!subtaskInput.trim()}>
              追加
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
