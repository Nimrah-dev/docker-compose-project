// ---------------------------------------------------------------
// notes.js : /api/notes ke saare routes (CRUD = Create, Read, Update, Delete)
// ---------------------------------------------------------------
const express = require("express");
const mongoose = require("mongoose");
const Note = require("../models/Note");

const router = express.Router();

// Galat id par server crash na ho, isliye pehle id check karte hain
const validId = (id) => mongoose.Types.ObjectId.isValid(id);

// READ: saare notes (naye sab se upar)
router.get("/", async (req, res) => {
  const notes = await Note.find().sort({ createdAt: -1 });
  res.json(notes);
});

// CREATE: naya note
router.post("/", async (req, res) => {
  const { title, content } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ message: "title is required" });
  }
  const note = await Note.create({ title, content });
  res.status(201).json(note);
});

// UPDATE: note badalna
router.put("/:id", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ message: "invalid id" });
  }
  const { title, content } = req.body || {};
  const note = await Note.findByIdAndUpdate(
    req.params.id,
    { title, content },
    { new: true, runValidators: true }
  );
  if (!note) return res.status(404).json({ message: "note not found" });
  res.json(note);
});

// DELETE: note hatana
router.delete("/:id", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ message: "invalid id" });
  }
  const note = await Note.findByIdAndDelete(req.params.id);
  if (!note) return res.status(404).json({ message: "note not found" });
  res.json({ message: "deleted" });
});

module.exports = router;
