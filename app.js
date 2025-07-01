import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pool from './db/db.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

let login = false;
let currentStudent = null;

// Login Page
app.get("/", (req, res) => {
  res.render("login");
});

// Handle Login
app.post("/login", async (req, res) => {
  const { username, roll_number } = req.body;
  const result = await pool.query(
    "SELECT * FROM students WHERE username=$1 AND roll_number=$2",
    [username, roll_number]
  );

  if (result.rows.length === 0) {
    return res.send("Invalid login details.");
  }

  login = true;
  currentStudent = result.rows[0];
  res.redirect("/admission-form");
});

// Show Admission Form
app.get("/admission-form", (req, res) => {
  if (login && currentStudent) {
    res.render("admission-form", { studentId: currentStudent.id });
  } else {
    res.redirect("/");
  }
});

// Handle Form Submission with application_number
app.post("/submit-admission", async (req, res) => {
  let { student_id, surname, application_number } = req.body;

  if (!student_id || isNaN(parseInt(student_id))) {
    return res.send("Invalid student ID.");
  }

  student_id = parseInt(student_id);

  await pool.query(
    `INSERT INTO admission_details (student_id, surname, application_number)
     VALUES ($1, $2, $3)`,
    [student_id, surname, application_number]
  );

  const statusResult = await pool.query(
    `SELECT status FROM students WHERE id = $1`,
    [student_id]
  );

  res.render("status", {
    status: statusResult.rows[0].status,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
