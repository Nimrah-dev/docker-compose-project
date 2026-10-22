// ---------------------------------------------------------------
// db.js : MongoDB se connect karne ka kaam (Mongoose ke zariye)
// ---------------------------------------------------------------
const mongoose = require("mongoose");

// MONGO_URI ek environment variable hai (settings ki chit).
// Docker mein:   mongodb://mongo:27017/notesdb
//                         ^^^^^ compose.yaml mein database service ka naam
// Bina Docker (apni machine par): mongodb://localhost:27017/notesdb
//
// Dhyan do: Docker mein "localhost" nahi chalta, kyunke container ke andar
// localhost ka matlab container khud hota hai, database wala container nahi.
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/notesdb";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Database kabhi kabhi thori dair se tayyar hota hai, isliye 10 baar koshish
// karte hain (har baar 3 second ruk kar). Phir bhi na ho to band kar dete hain.
async function connectDB(retries = 10) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(MONGO_URI);
      console.log("MongoDB connected");
      return;
    } catch (err) {
      console.log(`MongoDB connect failed (${attempt}/${retries}): ${err.message}`);
      await sleep(3000);
    }
  }
  console.error("Could not connect to MongoDB. Check MONGO_URI. Exiting.");
  process.exit(1);
}

module.exports = connectDB;
