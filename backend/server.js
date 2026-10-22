// ---------------------------------------------------------------
// server.js : backend ka entry point (yahin se app start hoti hai)
// ---------------------------------------------------------------
const express = require("express");
const connectDB = require("./src/config/db");
const notesRouter = require("./src/routes/notes");

const app = express();

// PORT "environment variable" se aata hai. Agar na mile to 5000 use hoga.
// Docker mein yeh value compose.yaml ke `environment:` se milti hai.
const PORT = process.env.PORT || 5000;

// Request ki body (JSON) ko padhne ke liye
app.use(express.json());

// Health check: sirf yeh batata hai ke backend zinda hai.
// Test: curl localhost:5000/api/health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Notes ke saare routes /api/notes se shuru honge
app.use("/api/notes", notesRouter);

// Koi bhi route fail ho to server crash nahi hota, 500 JSON error milta hai
// (Express 5 async routes ke errors khud yahan bhej deta hai)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "server error" });
});

// Pehle database se connect karo, phir server start karo.
// Agar database tak na pohanche to server start hi nahi hota.
connectDB().then(() => {
  app.listen(PORT, () => console.log(`API running on port ${PORT}`));
});
