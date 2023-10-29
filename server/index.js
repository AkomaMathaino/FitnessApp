const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const app = express();
require("dotenv").config();

process.env.CI = false;

const saltRounds = 10;

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000"] /* https://wegojim.net */,
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    key: "userId",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 10000000000,
    },
  })
);

const db = mysql.createPool({
  host: "localhost",
  user: "root" /* wegojygb_akomamathaino */,
  password: "password" /* process.env.DB_PASSWORD */,
  database: "fitnessapp" /* wegojygb_fitnessapp */,
});

const sendEmail = ({ OTP, recipient_email }) => {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      auth: {
        user: "dias.joshua7@gmail.com",
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mail_configs = {
      from: "wegojim315@gmail.com",
      to: recipient_email,
      subject: "Reset Password",
      html: `<!DOCTYPE html>
              <html>
                <body>
                  <div>
                    <p>Use the temporary password below to reset your password:</p>
                    <h2>${OTP}</h2>
                  </div>
                </body>
              </html>`,
    };

    transporter.sendMail(mail_configs, (error, info) => {
      if (error) {
        console.error(error);
        return reject({ message: "An error has occured" });
      }
      return resolve({ message: "Email sent successfully" });
    });
  });
};

app.post("/api/send-recovery-email", (req, res) => {
  const sqlSelect = `SELECT * FROM users WHERE email = ?`;

  db.query(sqlSelect, [req.body.recipient_email], (err, result) => {
    if (err) {
      console.log("Error executing SELECT query:", err);
    }

    if (result.length > 0) {
      sendEmail(req.body)
        .then((response) => res.send(response.message))
        .catch((error) => res.status(500).send(error.message));
    } else {
      res.send({ message: "User doesn't exist" });
    }
  });
});

app.put("/api/reset-password", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const sqlUpdate = `UPDATE users SET password = ? WHERE email = ?`;

  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      console.log("Error hashing password:", err);
      return res.status(500).json({ message: "Error during password reset" });
    }

    db.query(sqlUpdate, [hash, email], (err, result) => {
      if (err) {
        console.log("Error executing SQL query:", err);
        return res.status(500).json({ message: "Error during password reset" });
      } else {
        console.log("Password reset successful:", result);
        res.status(200).json({ message: "Password reset successful" });
      }
    });
  });
});

app.post("/api/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const firstName = req.body.firstName;

  const sqlPost =
    "INSERT INTO users (email, password, first_name) VALUES (?, ?, ?)";

  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      console.log("Error hashing password:", err);
      return res.status(500).json({ message: "Error during registration" });
    }

    db.query(sqlPost, [email, hash, firstName], (err, result) => {
      if (err) {
        console.log("Error executing SQL query:", err);
        return res.status(500).json({ message: "Error during registration" });
      }
      console.log("Registration successful:", result);
      res.status(200).json({ message: "Registration successful" });
    });
  });
});

app.get("/api/login", (req, res) => {
  if (req.session.user) {
    res.send({ loggedIn: true, user: req.session.user[0] });
  } else {
    res.send({ loggedIn: false });
  }
});

app.post("/api/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const sqlPost = "SELECT * FROM users WHERE email = ?";
  db.query(sqlPost, [email], (err, result) => {
    if (err) {
      res.send({ err: err });
    }

    if (result.length > 0) {
      bcrypt.compare(password, result[0].password, (err, response) => {
        if (response) {
          req.session.user = result;
          console.log(req.session.user);
          res.send(result);
        } else {
          res.send({ message: "Wrong email/password combination" });
        }
      });
    } else {
      res.send({ message: "User doesn't exist" });
    }
  });
});

app.delete("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    res.clearCookie("userId", {
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        expires: 10000000000,
      },
    });

    res.status(200).json({ message: "Logout successful" });
  });
});

app.get("/api/get/:userId", (req, res) => {
  const userId = req.params.userId;
  const sqlSelect = "SELECT * FROM users WHERE id = ?";

  db.query(sqlSelect, userId, (err, result) => {
    if (err) {
      res.status(500).json({ error: "Internal Server Error" });
      console.log(err);
    } else {
      res.status(200).json(result[0]);
    }
  });
});

app.post("/api/insert/profile", (req, res) => {
  const userId = req.body.userId;
  const weight = req.body.weight;
  const height = req.body.height;
  const age = req.body.age;
  const activityLevel = req.body.activityLevel;
  const gender = req.body.gender;
  const measurementType = req.body.measurementType;
  const weightGoal = req.body.weightGoal;
  const targetWeight = req.body.targetWeight;

  const sqlInsert =
    "INSERT INTO user_profiles (user_id, weight, height, age, activity_level, gender, measurement_type, weight_goal, target_weight) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
  db.query(
    sqlInsert,
    [
      userId,
      weight,
      height,
      age,
      activityLevel,
      gender,
      measurementType,
      weightGoal,
      targetWeight,
    ],
    (err, result) => {
      if (err) {
        res.status(500).json({ error: "Internal Server Error" });
        console.log(err);
      } else {
        res.status(200).json(result);
      }
    }
  );
});

app.put("/api/update/profile/:userId", (req, res) => {
  const userId = req.params.userId;
  const weight = req.body.weight;
  const height = req.body.height;
  const age = req.body.age;
  const activityLevel = req.body.activityLevel;
  const gender = req.body.gender;
  const measurementType = req.body.measurementType;
  const weightGoal = req.body.weightGoal;
  const targetWeight = req.body.targetWeight;

  const sqlUpdate = `
    UPDATE user_profiles 
    SET weight = ?, height = ?, age = ?, activity_level = ?, gender = ?, measurement_type = ?, weight_goal = ?, target_weight = ?
    WHERE user_id = ?
  `;

  db.query(
    sqlUpdate,
    [
      weight,
      height,
      age,
      activityLevel,
      gender,
      measurementType,
      weightGoal,
      targetWeight,
      userId,
    ],
    (err, result) => {
      if (err) {
        res.status(500).json({ error: "Internal Server Error" });
        console.log(err);
      } else {
        res.status(200).json(result);
      }
    }
  );
});

app.get("/api/get/profile/:userId", (req, res) => {
  const userId = req.params.userId;
  const sqlSelect = "SELECT * FROM user_profiles WHERE user_id = ?";

  db.query(sqlSelect, userId, (err, result) => {
    if (err) {
      console.error("Error retrieving profile:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else if (result.length === 0) {
      res.status(404).json({ error: "Profile not found" });
    } else {
      res.status(200).json(result[0]);
    }
  });
});

app.post("/api/insert/routine", (req, res) => {
  const userId = req.body.userId;
  const name = req.body.name;

  const sqlInsert =
    "INSERT INTO exercise_routines (user_id, name) VALUES (?, ?)";
  db.query(sqlInsert, [userId, name], (err, result) => {
    if (err) {
      res.status(500).json({ error: "Internal Server Error" });
      console.log(err);
    } else {
      res.status(200).json(result);
    }
  });
});

app.get("/api/get/routines/:userId", (req, res) => {
  const userId = req.params.userId;
  const sqlSelect = "SELECT * FROM exercise_routines WHERE user_id = ?";

  db.query(sqlSelect, userId, (err, result) => {
    if (err) {
      console.error("Error retrieving routines:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else if (result.length === 0) {
      res.status(404).json({ error: "Routines not found" });
    } else {
      res.status(200).json(result);
    }
  });
});

app.put("/api/update/routine/:id", (req, res) => {
  const id = req.params.id;
  const name = req.body.name;

  const sqlUpdate = `UPDATE exercise_routines SET name = ? WHERE id = ?`;

  db.query(sqlUpdate, [name, id], (err, result) => {
    if (err) {
      res.status(500).json({ error: "Internal Server Error" });
      console.log(err);
    } else {
      res.status(200).json(result);
    }
  });
});

app.delete("/api/delete/routine/:id", (req, res) => {
  const id = req.params.id;
  const sqlDelete = "DELETE FROM exercise_routines WHERE id = ?";

  db.query(sqlDelete, id, (err, result) => {
    if (err) {
      res.status(500).json({ error: "Internal Server Error" });
      console.error("Error deleting routine:", err);
    } else {
      res.status(204).send();
    }
  });
});

app.post("/api/insert/weight", (req, res) => {
  const userId = req.body.userId;
  const weight = req.body.weight;
  const date = req.body.date;

  const sqlInsert =
    "INSERT INTO weight_times (user_id, weight, date) VALUES (?, ?, ?)";
  db.query(sqlInsert, [userId, weight, date], (err, result) => {
    if (err) {
      res.status(500).json({ error: "Internal Server Error" });
      console.log(err);
    } else {
      res.status(200).json(result);
    }
  });
});

app.get("/api/get/weight/:userId", (req, res) => {
  const userId = req.params.userId;
  const sqlSelect = "SELECT * FROM weight_times WHERE user_id = ?";

  db.query(sqlSelect, [userId], (err, result) => {
    if (err) {
      console.error("Error retrieving weights:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else if (result.length === 0) {
      res.status(404).json({ error: "Weights not found" });
    } else {
      res.status(200).json(result);
    }
  });
});

app.put("/api/update/weight/:userId", (req, res) => {
  const userId = req.params.userId;
  const weight = req.body.weight;
  const date = req.body.date;

  const sqlUpdate = `UPDATE weight_times SET weight = ? WHERE user_id = ? AND date = ?`;

  db.query(sqlUpdate, [weight, userId, date], (err, result) => {
    if (err) {
      res.status(500).json({ error: "Internal Server Error" });
      console.log(err);
    } else {
      res.status(200).json(result);
    }
  });
});

app.post("/api/insert/exercise", (req, res) => {
  const userId = req.body.userId;
  const routineId = req.body.routineId;
  const name = req.body.name;
  const repsHigh = req.body.repsHigh;
  const repsLow = req.body.repsLow;
  const sets = req.body.sets;
  const weight = req.body.weight;
  const tracked = req.body.tracked;
  const bw = req.body.bw;
  const notes = req.body.notes;

  const sqlInsert =
    "INSERT INTO exercises (user_id, routine_id, name, reps_high, reps_low, sets, weight, tracked, bw, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  db.query(
    sqlInsert,
    [
      userId,
      routineId,
      name,
      repsHigh,
      repsLow,
      sets,
      weight,
      tracked,
      bw,
      notes,
    ],
    (err, result) => {
      if (err) {
        res.status(500).json({ error: "Internal Server Error" });
        console.log(err);
      } else {
        res.status(200).json(result);
      }
    }
  );
});

app.get("/api/get/exercises/:userId", (req, res) => {
  const userId = req.params.userId;
  const sqlSelect = "SELECT * FROM exercises WHERE user_id = ?";

  db.query(sqlSelect, [userId], (err, result) => {
    if (err) {
      console.error("Error retrieving weights:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else if (result.length === 0) {
      res.status(404).json({ error: "Exercises not found" });
    } else {
      res.status(200).json(result);
    }
  });
});

app.put("/api/update/exercise/:id", (req, res) => {
  const id = req.params.id;
  const name = req.body.name;
  const repsHigh = req.body.repsHigh;
  const repsLow = req.body.repsLow;
  const sets = req.body.sets;
  const weight = req.body.weight;
  const tracked = req.body.tracked;
  const bw = req.body.bw;
  const notes = req.body.notes;

  const sqlUpdate = `UPDATE exercises SET name = ?, reps_high = ?, reps_low = ?, sets = ?, weight = ?, tracked = ?, bw = ?, notes = ? WHERE id = ?`;

  db.query(
    sqlUpdate,
    [name, repsHigh, repsLow, sets, weight, tracked, bw, notes, id],
    (err, result) => {
      if (err) {
        res.status(500).json({ error: "Internal Server Error" });
        console.log(err);
      } else {
        res.status(200).json(result);
      }
    }
  );
});

app.delete("/api/delete/exercise/:id", (req, res) => {
  const id = req.params.id;
  const sqlDelete = "DELETE FROM exercises WHERE id = ?";

  db.query(sqlDelete, id, (err, result) => {
    if (err) {
      res.status(500).json({ error: "Internal Server Error" });
      console.error("Error deleting exercise:", err);
    } else {
      res.status(204).send();
    }
  });
});

app.post("/api/insert/tracked-exercise", (req, res) => {
  const userId = req.body.userId;
  const exerciseId = req.body.exerciseId;
  const name = req.body.name;
  const sets = req.body.sets;
  const repsHigh = req.body.repsHigh;
  const repsLow = req.body.repsLow;
  const weight = req.body.weight;
  const bw = req.body.bw;
  const date = req.body.date;

  const sqlInsert =
    "INSERT INTO tracked_exercises (user_id, exercise_id, name, sets, reps_high, reps_low, weight, bw, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
  db.query(
    sqlInsert,
    [userId, exerciseId, name, sets, repsHigh, repsLow, weight, bw, date],
    (err, result) => {
      if (err) {
        res.status(500).json({ error: "Internal Server Error" });
        console.log(err);
      } else {
        res.status(200).json(result);
      }
    }
  );
});

app.get("/api/get/tracked-exercises/:userId", (req, res) => {
  const userId = req.params.userId;
  const sqlSelect = "SELECT * FROM tracked_exercises WHERE user_id = ?";

  db.query(sqlSelect, [userId], (err, result) => {
    if (err) {
      console.error("Error retrieving weights:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else if (result.length === 0) {
      res.status(404).json({ error: "Exercises not found" });
    } else {
      res.status(200).json(result);
    }
  });
});

app.delete("/api/delete/tracked-exercise/:id", (req, res) => {
  const id = req.params.id;
  const sqlDelete = "DELETE FROM tracked_exercises WHERE id = ?";

  db.query(sqlDelete, id, (err, result) => {
    if (err) {
      res.status(500).json({ error: "Internal Server Error" });
      console.error("Error deleting exercise:", err);
    } else {
      res.status(204).send();
    }
  });
});

app.listen(3001, () => {
  console.log("running on port 3001");
});
