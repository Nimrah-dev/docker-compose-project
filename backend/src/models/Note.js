// ---------------------------------------------------------------
// Note.js : Mongoose ka "schema" (dhancha). Batata hai ke ek note kaisa hoga.
// ---------------------------------------------------------------
const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
  },
  { timestamps: true } // createdAt aur updatedAt khud ban jate hain
);

// Mongoose is model ko MongoDB mein "notes" naam ki collection mein rakhta hai
module.exports = mongoose.model("Note", noteSchema);
