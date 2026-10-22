// ---------------------------------------------------------------
// App.jsx : poori frontend app (React)
//
// Zaroori baat: yahan API ke addresses RELATIVE hain ("/api/notes"),
// "http://backend:5000/..." nahi. Wajah: yeh code user ke BROWSER mein
// chalta hai, aur browser ko Docker ke andar ke naam (backend) nahi pata.
// Browser /api/... nginx se maangta hai, aur nginx usay backend tak bhejta hai.
// ---------------------------------------------------------------
import { useEffect, useState } from "react";

const API = "/api/notes";

export default function App() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null); // null = naya note, warna edit
  const [error, setError] = useState("");
  const [apiUp, setApiUp] = useState(null); // null = check ho raha, true/false

  // Notes server se lao
  async function loadNotes() {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error("bad response");
      setNotes(await res.json());
      setError("");
    } catch {
      setError("Cannot load notes. Check that the backend and database are running.");
    }
  }

  // Backend zinda hai ya nahi (Docker seekhne mein yeh dikhana kaam aata hai)
  async function checkHealth() {
    try {
      const res = await fetch("/api/health");
      setApiUp(res.ok);
    } catch {
      setApiUp(false);
    }
  }

  // Page khulte hi ek baar chalta hai
  useEffect(() => {
    loadNotes();
    checkHealth();
  }, []);

  function resetForm() {
    setTitle("");
    setContent("");
    setEditingId(null);
  }

  // Add ya Save (editingId hai to PUT, warna POST)
  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error("save failed");
      resetForm();
      loadNotes();
    } catch {
      setError("Could not save the note. Try again.");
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      if (editingId === id) resetForm();
      loadNotes();
    } catch {
      setError("Could not delete the note. Try again.");
    }
  }

  function startEdit(note) {
    setEditingId(note._id);
    setTitle(note.title);
    setContent(note.content || "");
    window.scrollTo({ top: 0 });
  }

  return (
    <main className="page">
      <header className="head">
        <h1>Notes</h1>
        <p className={`status ${apiUp === false ? "down" : apiUp ? "up" : ""}`}>
          {apiUp === null && "Checking API..."}
          {apiUp === true && "API connected"}
          {apiUp === false && "API not reachable"}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="form">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What do you want to remember?"
        />
        <label htmlFor="content">Details</label>
        <textarea
          id="content"
          rows="3"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Optional"
        />
        <div className="actions">
          <button type="submit" className="primary">
            {editingId ? "Save changes" : "Add note"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {notes.length === 0 && !error ? (
        <p className="empty">No notes yet. Add your first note above.</p>
      ) : (
        <ul className="list">
          {notes.map((note) => (
            <li key={note._id} className="item">
              <div className="text">
                <h2>{note.title}</h2>
                {note.content && <p>{note.content}</p>}
              </div>
              <div className="row-actions">
                <button type="button" onClick={() => startEdit(note)}>
                  Edit
                </button>
                <button type="button" className="danger" onClick={() => handleDelete(note._id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
