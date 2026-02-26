import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { generateQuote, generateRecipes } from "./src/services/geminiService.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("forge75.db");

// Migration helper
const addColumn = (table: string, column: string, definition: string) => {
  const info = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
  if (!info.find(col => col.name === column)) {
    console.log(`Adding column ${column} to ${table}`);
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  }
};

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    is_subscribed INTEGER DEFAULT 0,
    religious_mode INTEGER DEFAULT 0,
    has_diabetes INTEGER DEFAULT 0,
    is_admin INTEGER DEFAULT 0,
    share_progress INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Ensure columns exist (Migrations)
addColumn('users', 'is_admin', 'INTEGER DEFAULT 0');
addColumn('users', 'share_progress', 'INTEGER DEFAULT 0');
addColumn('daily_logs', 'reading_type', "TEXT DEFAULT 'regular'");
addColumn('daily_logs', 'bible_study_done', "INTEGER DEFAULT 0");
addColumn('challenges', 'macro_calories', "INTEGER DEFAULT 2000");
addColumn('challenges', 'macro_protein', "REAL DEFAULT 150");
addColumn('challenges', 'macro_carbs', "REAL DEFAULT 200");
addColumn('challenges', 'macro_fat', "REAL DEFAULT 70");
addColumn('stats_history', 'ecw', "REAL DEFAULT 0");
addColumn('stats_history', 'tbw', "REAL DEFAULT 0");

db.exec(`
  CREATE TABLE IF NOT EXISTS promo_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    discount_type TEXT, -- free, percentage, fixed
    discount_value REAL,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    receiver_id INTEGER,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS profiles (
    user_id INTEGER PRIMARY KEY,
    name TEXT,
    height REAL,
    starting_weight REAL,
    goal_weight REAL,
    why_statement TEXT,
    starting_photo_url TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    start_date DATE,
    is_active INTEGER DEFAULT 1,
    water_goal_glasses INTEGER,
    steps_goal INTEGER,
    workouts_count INTEGER,
    cardio_minutes INTEGER,
    reading_goal_pages INTEGER,
    prayer_devotion INTEGER DEFAULT 0,
    fasting_hours INTEGER DEFAULT 0,
    quit_nicotine INTEGER DEFAULT 0,
    quit_alcohol INTEGER DEFAULT 0,
    quit_porn INTEGER DEFAULT 0,
    meds_vitamins TEXT, -- JSON string of meds and times
    macro_calories INTEGER DEFAULT 2000,
    macro_protein REAL DEFAULT 150,
    macro_carbs REAL DEFAULT 200,
    macro_fat REAL DEFAULT 70,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS daily_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    challenge_id INTEGER,
    log_date DATE,
    water_intake_glasses INTEGER DEFAULT 0,
    steps_count INTEGER DEFAULT 0,
    workouts_done INTEGER DEFAULT 0,
    cardio_done INTEGER DEFAULT 0,
    reading_done INTEGER DEFAULT 0,
    reading_type TEXT DEFAULT 'regular',
    bible_study_done INTEGER DEFAULT 0,
    prayer_done INTEGER DEFAULT 0,
    fasting_done INTEGER DEFAULT 0,
    nicotine_free INTEGER DEFAULT 0,
    alcohol_free INTEGER DEFAULT 0,
    porn_free INTEGER DEFAULT 0,
    meds_taken TEXT, -- JSON string of status
    notes TEXT,
    UNIQUE(user_id, log_date),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(challenge_id) REFERENCES challenges(id)
  );

  CREATE TABLE IF NOT EXISTS food_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    log_date DATE,
    meal_type TEXT, -- breakfast, lunch, dinner, snack
    food_name TEXT,
    calories INTEGER,
    protein REAL,
    carbs REAL,
    fat REAL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS stats_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    log_date DATE,
    weight REAL,
    body_fat REAL,
    muscle_mass REAL,
    ecw REAL DEFAULT 0,
    tbw REAL DEFAULT 0,
    photo_url TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // --- API Routes ---

  // Mock Auth (In a real app, use JWT and proper hashing)
  app.post("/api/auth/signup", (req, res) => {
    const { email, password } = req.body;
    try {
      const isAdmin = email.toLowerCase() === 'clay8888yt@gmail.com' ? 1 : 0;
      const info = db.prepare("INSERT INTO users (email, password, is_admin) VALUES (?, ?, ?)").run(email, password, isAdmin);
      res.json({ id: info.lastInsertRowid, email, is_admin: isAdmin });
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      if (email.toLowerCase() === 'clay8888yt@gmail.com' && !user.is_admin) {
        db.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").run(user.id);
        user.is_admin = 1;
      }
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/profile/:userId", (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.userId);
    const profile = db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(req.params.userId);
    res.json({ ...user, profile });
  });

  app.post("/api/profile/:userId", (req, res) => {
    const { name, height, starting_weight, goal_weight, why_statement, starting_photo_url, religious_mode, has_diabetes } = req.body;
    const userId = req.params.userId;

    db.prepare("UPDATE users SET religious_mode = ?, has_diabetes = ? WHERE id = ?").run(religious_mode ? 1 : 0, has_diabetes ? 1 : 0, userId);

    const existing = db.prepare("SELECT user_id FROM profiles WHERE user_id = ?").get(userId);
    if (existing) {
      db.prepare(`
        UPDATE profiles SET name = ?, height = ?, starting_weight = ?, goal_weight = ?, why_statement = ?, starting_photo_url = ?
        WHERE user_id = ?
      `).run(name, height, starting_weight, goal_weight, why_statement, starting_photo_url, userId);
    } else {
      db.prepare(`
        INSERT INTO profiles (user_id, name, height, starting_weight, goal_weight, why_statement, starting_photo_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(userId, name, height, starting_weight, goal_weight, why_statement, starting_photo_url);
    }
    res.json({ success: true });
  });

  app.post("/api/profile/photo/:userId", (req, res) => {
    const { photoUrl } = req.body;
    const userId = req.params.userId;
    db.prepare("UPDATE profiles SET starting_photo_url = ? WHERE user_id = ?").run(photoUrl, userId);
    res.json({ success: true });
  });

  app.post("/api/challenge/setup", (req, res) => {
    const { userId, config } = req.body;
    // Deactivate old challenges
    db.prepare("UPDATE challenges SET is_active = 0 WHERE user_id = ?").run(userId);
    
    const info = db.prepare(`
      INSERT INTO challenges (
        user_id, start_date, is_active, water_goal_glasses, steps_goal, workouts_count, 
        cardio_minutes, reading_goal_pages, prayer_devotion, fasting_hours, 
        quit_nicotine, quit_alcohol, quit_porn, meds_vitamins,
        macro_calories, macro_protein, macro_carbs, macro_fat
      ) VALUES (?, DATE('now'), 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId, 
      config.water_goal_glasses, 
      config.steps_goal, 
      config.workouts_count, 
      config.cardio_minutes, 
      config.reading_goal_pages, 
      config.prayer_devotion ? 1 : 0, 
      config.fasting_hours, 
      config.quit_nicotine ? 1 : 0, 
      config.quit_alcohol ? 1 : 0, 
      config.quit_porn ? 1 : 0, 
      JSON.stringify(config.meds_vitamins),
      config.macro_calories || 2000,
      config.macro_protein || 150,
      config.macro_carbs || 200,
      config.macro_fat || 70
    );
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/challenge/active/:userId", (req, res) => {
    const challenge = db.prepare("SELECT * FROM challenges WHERE user_id = ? AND is_active = 1").get(req.params.userId);
    if (challenge) {
      challenge.meds_vitamins = JSON.parse(challenge.meds_vitamins || '[]');
    }
    res.json(challenge);
  });

  app.get("/api/logs/daily/:userId/:date", (req, res) => {
    const log = db.prepare("SELECT * FROM daily_logs WHERE user_id = ? AND log_date = ?").get(req.params.userId, req.params.date);
    if (log && log.meds_taken) {
      log.meds_taken = JSON.parse(log.meds_taken);
    }
    res.json(log);
  });

  app.post("/api/logs/daily", (req, res) => {
    const { userId, challengeId, date, data } = req.body;
    const existing = db.prepare("SELECT id FROM daily_logs WHERE user_id = ? AND log_date = ?").get(userId, date);
    
    const meds_taken = JSON.stringify(data.meds_taken || []);

    if (existing) {
      db.prepare(`
        UPDATE daily_logs SET 
          water_intake_glasses = ?, steps_count = ?, workouts_done = ?, cardio_done = ?, 
          reading_done = ?, reading_type = ?, bible_study_done = ?, prayer_done = ?, fasting_done = ?, nicotine_free = ?, 
          alcohol_free = ?, porn_free = ?, meds_taken = ?, notes = ?
        WHERE id = ?
      `).run(
        data.water_intake_glasses, data.steps_count, data.workouts_done, data.cardio_done,
        data.reading_done, data.reading_type || 'regular', data.bible_study_done || 0, data.prayer_done, data.fasting_done, data.nicotine_free,
        data.alcohol_free, data.porn_free, meds_taken, data.notes, existing.id
      );
    } else {
      db.prepare(`
        INSERT INTO daily_logs (
          user_id, challenge_id, log_date, water_intake_glasses, steps_count, workouts_done, 
          cardio_done, reading_done, reading_type, bible_study_done, prayer_done, fasting_done, nicotine_free, 
          alcohol_free, porn_free, meds_taken, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId, challengeId, date, data.water_intake_glasses, data.steps_count, data.workouts_done,
        data.cardio_done, data.reading_done, data.reading_type || 'regular', data.bible_study_done || 0, data.prayer_done, data.fasting_done, data.nicotine_free,
        data.alcohol_free, data.porn_free, meds_taken, data.notes
      );
    }
    res.json({ success: true });
  });

  app.get("/api/stats/:userId", (req, res) => {
    const stats = db.prepare("SELECT * FROM stats_history WHERE user_id = ? ORDER BY log_date ASC").all(req.params.userId);
    res.json(stats);
  });

  app.post("/api/stats", (req, res) => {
    const { userId, date, weight, body_fat, muscle_mass, ecw, tbw, photo_url } = req.body;
    db.prepare(`
      INSERT INTO stats_history (user_id, log_date, weight, body_fat, muscle_mass, ecw, tbw, photo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, date, weight, body_fat, muscle_mass, ecw || 0, tbw || 0, photo_url);
    res.json({ success: true });
  });

  app.get("/api/food/:userId/:date", (req, res) => {
    const logs = db.prepare("SELECT * FROM food_logs WHERE user_id = ? AND log_date = ?").all(req.params.userId, req.params.date);
    res.json(logs);
  });

  app.post("/api/food", (req, res) => {
    const { userId, date, meal_type, food_name, calories, protein, carbs, fat } = req.body;
    db.prepare(`
      INSERT INTO food_logs (user_id, log_date, meal_type, food_name, calories, protein, carbs, fat)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, date, meal_type, food_name, calories, protein, carbs, fat);
    res.json({ success: true });
  });

  app.delete("/api/food/:id", (req, res) => {
    db.prepare("DELETE FROM food_logs WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.put("/api/food/:id", (req, res) => {
    const { food_name, calories, protein, carbs, fat } = req.body;
    db.prepare(`
      UPDATE food_logs SET food_name = ?, calories = ?, protein = ?, carbs = ?, fat = ?
      WHERE id = ?
    `).run(food_name, calories, protein, carbs, fat, req.params.id);
    res.json({ success: true });
  });

  // --- Admin Routes ---
  app.get("/api/admin/users", (req, res) => {
    const users = db.prepare("SELECT id, email, is_admin, is_subscribed FROM users").all();
    res.json(users);
  });

  app.post("/api/admin/set-admin", (req, res) => {
    const { email, isAdmin } = req.body;
    db.prepare("UPDATE users SET is_admin = ? WHERE email = ?").run(isAdmin ? 1 : 0, email);
    res.json({ success: true });
  });

  app.post("/api/admin/toggle-promo", (req, res) => {
    const { id, isActive } = req.body;
    db.prepare("UPDATE promo_codes SET is_active = ? WHERE id = ?").run(isActive ? 1 : 0, id);
    res.json({ success: true });
  });

  app.post("/api/admin/promo-codes", (req, res) => {
    const { code, discount_type, discount_value } = req.body;
    db.prepare("INSERT INTO promo_codes (code, discount_type, discount_value) VALUES (?, ?, ?)").run(code, discount_type, discount_value);
    res.json({ success: true });
  });

  app.get("/api/admin/promo-codes", (req, res) => {
    const codes = db.prepare("SELECT * FROM promo_codes").all();
    res.json(codes);
  });

  app.post("/api/promo/apply", (req, res) => {
    const { userId, code } = req.body;
    const promo = db.prepare("SELECT * FROM promo_codes WHERE code = ? AND is_active = 1").get(code);
    if (promo) {
      if (promo.discount_type === 'free') {
        db.prepare("UPDATE users SET is_subscribed = 1 WHERE id = ?").run(userId);
      }
      res.json({ success: true, promo });
    } else {
      res.status(400).json({ error: "Invalid or inactive promo code" });
    }
  });

  // --- Social Routes ---
  app.get("/api/social/users", (req, res) => {
    const users = db.prepare(`
      SELECT u.id, u.email, u.religious_mode, p.name, p.starting_photo_url
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      WHERE u.share_progress = 1
    `).all();
    res.json(users);
  });

  app.post("/api/social/share-toggle", (req, res) => {
    const { userId, share } = req.body;
    db.prepare("UPDATE users SET share_progress = ? WHERE id = ?").run(share ? 1 : 0, userId);
    res.json({ success: true });
  });

  app.get("/api/social/messages/:userId/:otherId", (req, res) => {
    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `).all(req.params.userId, req.params.otherId, req.params.otherId, req.params.userId);
    res.json(messages);
  });

  app.post("/api/social/messages", (req, res) => {
    const { senderId, receiverId, content } = req.body;
    db.prepare("INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)").run(senderId, receiverId, content);
    res.json({ success: true });
  });

  app.post("/api/challenge/reset", (req, res) => {
    const { userId } = req.body;
    db.prepare("UPDATE challenges SET is_active = 0 WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM daily_logs WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM food_logs WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM stats_history WHERE user_id = ?").run(userId);
    res.json({ success: true });
  });

  app.get("/api/ai/quote", async (req, res) => {
    const religious = req.query.religious === 'true' || req.query.religious === '1';
    try {
      const quote = await generateQuote(religious);
      res.json(quote);
    } catch (e) {
      res.status(500).json({ error: "Failed to generate quote" });
    }
  });

  app.post("/api/ai/recipes", async (req, res) => {
    const { category, macros, diabetes } = req.body;
    try {
      const recipes = await generateRecipes(category, macros, diabetes);
      res.json(recipes);
    } catch (e) {
      res.status(500).json({ error: "Failed to generate recipes" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
