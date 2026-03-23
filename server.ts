import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("forge75.db");

// Migration helper
const addColumn = (table: string, column: string, definition: string) => {
  try {
    // Check if column exists first
    const tableInfo = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
    const exists = tableInfo.some(col => col.name === column);
    
    if (!exists) {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
      console.log(`Added column ${column} to ${table}`);
    }
  } catch (error: any) {
    if (error.message.includes('duplicate column name')) {
      // Column already exists, ignore
    } else {
      console.error(`Error adding column ${column} to ${table}:`, error);
    }
  }
};

console.log("Initializing database...");
// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    firebase_uid TEXT UNIQUE,
    phone TEXT,
    is_subscribed INTEGER DEFAULT 0,
    religious_mode INTEGER DEFAULT 0,
    has_diabetes INTEGER DEFAULT 0,
    is_admin INTEGER DEFAULT 0,
    share_progress INTEGER DEFAULT 0,
    theme TEXT DEFAULT 'dark',
    accent_color TEXT DEFAULT '#3b82f6',
    notifications_enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

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
    is_finalized INTEGER DEFAULT 0,
    UNIQUE(user_id, log_date),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(challenge_id) REFERENCES challenges(id)
  );

  CREATE TABLE IF NOT EXISTS social_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    category TEXT, -- run-club, bible-study, accountability, general
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS social_group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER,
    user_id INTEGER,
    role TEXT DEFAULT 'member', -- member, admin, founder
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id),
    FOREIGN KEY(group_id) REFERENCES social_groups(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS social_channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(group_id) REFERENCES social_groups(id)
  );

  CREATE TABLE IF NOT EXISTS social_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER, -- NULL for global board
    user_id INTEGER,
    content TEXT,
    channel_id TEXT DEFAULT 'general',
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(group_id) REFERENCES social_groups(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS social_playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    url TEXT,
    category TEXT, -- running, gym, house, bible-study, other
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS social_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    connected_user_id INTEGER,
    status TEXT DEFAULT 'pending', -- pending, accepted
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(connected_user_id) REFERENCES users(id)
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

  CREATE TABLE IF NOT EXISTS saved_recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    ingredients TEXT,
    instructions TEXT,
    macros TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

  CREATE TABLE IF NOT EXISTS periodic_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    day_number INTEGER,
    what_worked TEXT,
    what_didnt_work TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS bible_studies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    log_date DATE,
    scripture TEXT,
    reflection TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Ensure columns exist (Migrations) - Moved after table creation
addColumn('users', 'is_admin', 'INTEGER DEFAULT 0');
addColumn('users', 'share_progress', 'INTEGER DEFAULT 0');
addColumn('users', 'phone', 'TEXT');
addColumn('users', 'firebase_uid', 'TEXT UNIQUE');
addColumn('users', 'theme', "TEXT DEFAULT 'dark'");
addColumn('users', 'accent_color', "TEXT DEFAULT '#3b82f6'");
addColumn('users', 'notifications_enabled', "INTEGER DEFAULT 1");
addColumn('profiles', 'dietary_restrictions', 'TEXT');
addColumn('daily_logs', 'reading_type', "TEXT DEFAULT 'regular'");
addColumn('daily_logs', 'bible_study_done', "INTEGER DEFAULT 0");
addColumn('challenges', 'macro_calories', "INTEGER DEFAULT 2000");
addColumn('challenges', 'macro_protein', "REAL DEFAULT 150");
addColumn('challenges', 'macro_carbs', "REAL DEFAULT 200");
addColumn('challenges', 'macro_fat', "REAL DEFAULT 70");
addColumn('daily_logs', 'is_finalized', "INTEGER DEFAULT 0");
addColumn('stats_history', 'ecw', "REAL DEFAULT 0");
addColumn('stats_history', 'tbw', "REAL DEFAULT 0");
addColumn('social_messages', 'channel_id', "TEXT DEFAULT 'general'");
addColumn('social_messages', 'image_url', "TEXT");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // --- API Routes ---
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Ensure founder is admin on every login/startup check
  const ensureFounderAdmin = (email: string) => {
    if (email === 'clay8888yt@gmail.com') {
      db.prepare("UPDATE users SET is_admin = 1 WHERE email = ?").run(email);
    }
  };

  app.get("/api/health", (req, res) => {
    try {
      const userTable = db.prepare("PRAGMA table_info(users)").all() as any[];
      const columns = userTable.map(c => c.name);
      res.json({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        database: {
          users_columns: columns,
          has_firebase_uid: columns.includes('firebase_uid'),
          has_phone: columns.includes('phone')
        }
      });
    } catch (error) {
      res.status(500).json({ status: "error", error: String(error) });
    }
  });

  // Mock Auth (In a real app, use JWT and proper hashing)
  app.post("/api/auth/firebase", (req, res) => {
    try {
      const { uid, email, phone, displayName, photoURL } = req.body;
      console.log('Firebase Auth Sync Request:', { uid, email, phone, displayName });
      
      if (!uid) {
        return res.status(400).json({ error: 'Missing UID' });
      }

      const cleanEmail = (email && email.trim() !== "") ? email.trim().toLowerCase() : null;
      const cleanPhone = (phone && phone.trim() !== "") ? phone.trim() : null;

      // Try to find user by firebase_uid
      let user: any = null;
      try {
        user = db.prepare("SELECT * FROM users WHERE firebase_uid = ?").get(uid) as any;
      } catch (dbErr: any) {
        if (dbErr.message.includes('no such column: firebase_uid')) {
          console.error('CRITICAL: firebase_uid column missing. Attempting emergency migration.');
          addColumn('users', 'firebase_uid', 'TEXT UNIQUE');
          user = db.prepare("SELECT * FROM users WHERE firebase_uid = ?").get(uid) as any;
        } else {
          throw dbErr;
        }
      }
      
      if (!user && cleanEmail) {
        // Try to find user by email and link them
        user = db.prepare("SELECT * FROM users WHERE email = ?").get(cleanEmail) as any;
        if (user) {
          console.log('Linking existing email user to firebase_uid:', cleanEmail);
          try {
            db.prepare("UPDATE users SET firebase_uid = ?, phone = COALESCE(phone, ?) WHERE id = ?").run(uid, cleanPhone, user.id);
            user.firebase_uid = uid;
            if (cleanPhone) user.phone = cleanPhone;
          } catch (linkError) {
            console.error('Error linking user:', linkError);
            return res.status(409).json({ error: 'This account is already linked to another user' });
          }
        }
      }

      if (!user && cleanPhone) {
        // Try to find user by phone and link them
        user = db.prepare("SELECT * FROM users WHERE phone = ?").get(cleanPhone) as any;
        if (user) {
          console.log('Linking existing phone user to firebase_uid:', cleanPhone);
          try {
            db.prepare("UPDATE users SET firebase_uid = ?, email = COALESCE(email, ?) WHERE id = ?").run(uid, cleanEmail, user.id);
            user.firebase_uid = uid;
            if (cleanEmail) user.email = cleanEmail;
          } catch (linkError) {
            console.error('Error linking user by phone:', linkError);
            return res.status(409).json({ error: 'This phone number is already linked to another user' });
          }
        }
      }

      if (!user) {
        // Create new user
        console.log('Creating new user from Firebase sync:', cleanEmail || cleanPhone);
        const isAdmin = (cleanEmail && cleanEmail === 'clay8888yt@gmail.com') ? 1 : 0;
        try {
          const info = db.prepare("INSERT INTO users (email, firebase_uid, phone, is_admin) VALUES (?, ?, ?, ?)").run(cleanEmail, uid, cleanPhone, isAdmin);
          user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
        } catch (insertError: any) {
          console.error('Error creating user during sync:', insertError);
          if (insertError.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'An account with this email or phone already exists.' });
          }
          throw insertError;
        }
      }

      if (user && cleanEmail === 'clay8888yt@gmail.com' && !user.is_admin) {
        db.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").run(user.id);
        user.is_admin = 1;
      }

      // Ensure user has a profile record
      const profile = db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(user.id);
      if (!profile) {
        db.prepare("INSERT OR IGNORE INTO profiles (user_id, name, starting_photo_url) VALUES (?, ?, ?)")
          .run(user.id, displayName || cleanEmail?.split('@')[0] || 'Member', photoURL || null);
      } else if (photoURL && !profile.starting_photo_url) {
        db.prepare("UPDATE profiles SET starting_photo_url = ? WHERE id = ?").run(photoURL, profile.id);
      }

      const finalProfile = db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(user.id);
      res.json({ ...user, profile: finalProfile });
    } catch (error: any) {
      console.error('Firebase Auth Sync Error:', error);
      res.status(500).json({ error: 'Internal server error during sync: ' + error.message });
    }
  });

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
    try {
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.userId) as any;
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (user.email) {
        ensureFounderAdmin(user.email);
      }
      
      const normalizedUser = {
        ...user,
        is_subscribed: !!user.is_subscribed,
        religious_mode: !!user.religious_mode,
        has_diabetes: !!user.has_diabetes,
        is_admin: !!user.is_admin,
        notifications_enabled: !!user.notifications_enabled
      };
      
      const profile = db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(req.params.userId);
      res.json({ ...normalizedUser, profile });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Internal server error fetching profile' });
    }
  });

  app.post("/api/profile/:userId", (req, res) => {
    const { 
      name, height, starting_weight, goal_weight, why_statement, starting_photo_url, 
      religious_mode, has_diabetes, phone, dietary_restrictions,
      theme, accent_color, notifications_enabled
    } = req.body;
    const userId = req.params.userId;

    if (phone !== undefined) {
      db.prepare("UPDATE users SET phone = ? WHERE id = ?").run(phone, userId);
    }
    
    if (theme !== undefined) {
      db.prepare("UPDATE users SET theme = ? WHERE id = ?").run(theme, userId);
    }
    
    if (accent_color !== undefined) {
      db.prepare("UPDATE users SET accent_color = ? WHERE id = ?").run(accent_color, userId);
    }
    
    if (notifications_enabled !== undefined) {
      db.prepare("UPDATE users SET notifications_enabled = ? WHERE id = ?").run(notifications_enabled ? 1 : 0, userId);
    }

    db.prepare("UPDATE users SET religious_mode = ?, has_diabetes = ? WHERE id = ?").run(religious_mode ? 1 : 0, has_diabetes ? 1 : 0, userId);

    const existing = db.prepare("SELECT user_id FROM profiles WHERE user_id = ?").get(userId);
    if (existing) {
      db.prepare(`
        UPDATE profiles SET name = ?, height = ?, starting_weight = ?, goal_weight = ?, why_statement = ?, starting_photo_url = ?, dietary_restrictions = ?
        WHERE user_id = ?
      `).run(name, height, starting_weight, goal_weight, why_statement, starting_photo_url, dietary_restrictions, userId);
    } else {
      db.prepare(`
        INSERT INTO profiles (user_id, name, height, starting_weight, goal_weight, why_statement, starting_photo_url, dietary_restrictions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, name, height, starting_weight, goal_weight, why_statement, starting_photo_url, dietary_restrictions);
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

  app.get("/api/logs/:userId", (req, res) => {
    const logs = db.prepare("SELECT * FROM daily_logs WHERE user_id = ? ORDER BY log_date ASC").all(req.params.userId) as any[];
    logs.forEach(log => {
      if (log.meds_taken) log.meds_taken = JSON.parse(log.meds_taken);
    });
    res.json(logs);
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
    const is_finalized = data.is_finalized ? 1 : 0;

    if (existing) {
      db.prepare(`
        UPDATE daily_logs SET 
          water_intake_glasses = ?, steps_count = ?, workouts_done = ?, cardio_done = ?, 
          reading_done = ?, reading_type = ?, bible_study_done = ?, prayer_done = ?, fasting_done = ?, nicotine_free = ?, 
          alcohol_free = ?, porn_free = ?, meds_taken = ?, notes = ?, is_finalized = ?
        WHERE id = ?
      `).run(
        data.water_intake_glasses, data.steps_count, data.workouts_done, data.cardio_done,
        data.reading_done, data.reading_type || 'regular', data.bible_study_done || 0, data.prayer_done, data.fasting_done, data.nicotine_free,
        data.alcohol_free, data.porn_free, meds_taken, data.notes, is_finalized, existing.id
      );
    } else {
      db.prepare(`
        INSERT INTO daily_logs (
          user_id, challenge_id, log_date, water_intake_glasses, steps_count, workouts_done, 
          cardio_done, reading_done, reading_type, bible_study_done, prayer_done, fasting_done, nicotine_free, 
          alcohol_free, porn_free, meds_taken, notes, is_finalized
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId, challengeId, date, data.water_intake_glasses, data.steps_count, data.workouts_done,
        data.cardio_done, data.reading_done, data.reading_type || 'regular', data.bible_study_done || 0, data.prayer_done, data.fasting_done, data.nicotine_free,
        data.alcohol_free, data.porn_free, meds_taken, data.notes, is_finalized
      );
    }
    res.json({ success: true });
  });

  app.post("/api/logs/finalize", (req, res) => {
    const { userId, date } = req.body;
    db.prepare("UPDATE daily_logs SET is_finalized = 1 WHERE user_id = ? AND log_date = ?").run(userId, date);
    res.json({ success: true });
  });

  app.get("/api/stats/:userId", (req, res) => {
    const stats = db.prepare("SELECT * FROM stats_history WHERE user_id = ? ORDER BY log_date ASC").all(req.params.userId);
    res.json(stats);
  });

  app.get("/api/social/reports/:userId", (req, res) => {
    const reports = db.prepare("SELECT * FROM periodic_reports WHERE user_id = ? ORDER BY day_number ASC").all(req.params.userId);
    res.json(reports);
  });

  app.post("/api/social/reports", (req, res) => {
    const { userId, dayNumber, whatWorked, whatDidntWork } = req.body;
    db.prepare(`
      INSERT INTO periodic_reports (user_id, day_number, what_worked, what_didnt_work)
      VALUES (?, ?, ?, ?)
    `).run(userId, dayNumber, whatWorked, whatDidntWork);
    res.json({ success: true });
  });

  app.get("/api/bible-studies/:userId", (req, res) => {
    const studies = db.prepare("SELECT * FROM bible_studies WHERE user_id = ? ORDER BY log_date DESC").all(req.params.userId);
    res.json(studies);
  });

  app.post("/api/bible-studies", (req, res) => {
    const { userId, date, scripture, reflection } = req.body;
    db.prepare(`
      INSERT INTO bible_studies (user_id, log_date, scripture, reflection)
      VALUES (?, ?, ?, ?)
    `).run(userId, date, scripture, reflection);
    res.json({ success: true });
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
    // Ensure founder is always admin in the DB
    db.prepare("UPDATE users SET is_admin = 1 WHERE LOWER(email) = 'clay8888yt@gmail.com'").run();
    const users = db.prepare("SELECT id, email, is_admin, is_subscribed FROM users").all();
    res.json(users);
  });

  app.post("/api/admin/set-admin", (req, res) => {
    const { adminId, email, isAdmin } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    
    const admin = db.prepare("SELECT email, is_admin FROM users WHERE id = ?").get(adminId) as any;
    const isFounder = admin?.email?.toLowerCase() === 'clay8888yt@gmail.com';
    
    if (admin?.is_admin || isFounder) {
      const targetEmail = email.trim().toLowerCase();
      // Don't allow removing the founder
      if (targetEmail === 'clay8888yt@gmail.com' && !isAdmin) {
        return res.status(400).json({ error: "Cannot remove founder as admin" });
      }

      const result = db.prepare("UPDATE users SET is_admin = ? WHERE LOWER(email) = ?").run(isAdmin ? 1 : 0, targetEmail);
      if (result.changes === 0) {
        return res.status(404).json({ error: "User not found with that email" });
      }
      res.json({ success: true });
    } else {
      res.status(403).json({ error: "Unauthorized" });
    }
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
      SELECT u.id, u.email, u.phone, u.religious_mode, u.is_admin, p.name, p.starting_photo_url
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      WHERE u.share_progress = 1
    `).all();
    res.json(users);
  });

  app.get("/api/social/groups", (req, res) => {
    const groups = db.prepare(`
      SELECT sg.*, p.name as founder_name,
      (SELECT COUNT(*) FROM social_group_members WHERE group_id = sg.id) as member_count
      FROM social_groups sg
      JOIN profiles p ON sg.created_by = p.user_id
    `).all();
    res.json(groups);
  });

  app.post("/api/social/groups", (req, res) => {
    const { name, description, category, userId } = req.body;
    const info = db.prepare("INSERT INTO social_groups (name, description, category, created_by) VALUES (?, ?, ?, ?)").run(name, description, category, userId);
    const groupId = info.lastInsertRowid;
    // Founder joins automatically
    db.prepare("INSERT INTO social_group_members (group_id, user_id, role) VALUES (?, ?, ?)").run(groupId, userId, 'founder');
    res.json({ id: groupId });
  });

  app.post("/api/social/groups/:groupId/join", (req, res) => {
    const { userId } = req.body;
    try {
      db.prepare("INSERT INTO social_group_members (group_id, user_id) VALUES (?, ?)").run(req.params.groupId, userId);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Already a member or group doesn't exist" });
    }
  });

  app.get("/api/social/groups/:groupId/members", (req, res) => {
    const members = db.prepare(`
      SELECT sgm.*, p.name, p.starting_photo_url, u.is_admin as is_global_admin
      FROM social_group_members sgm
      JOIN profiles p ON sgm.user_id = p.user_id
      JOIN users u ON sgm.user_id = u.id
      WHERE sgm.group_id = ?
    `).all(req.params.groupId);
    res.json(members);
  });

  app.get("/api/social/groups/:groupId/channels", (req, res) => {
    const channels = db.prepare("SELECT * FROM social_channels WHERE group_id = ? ORDER BY created_at ASC").all(req.params.groupId);
    if (channels.length === 0) {
      // Default to general if no channels exist
      res.json([{ id: 0, group_id: req.params.groupId, name: 'general' }]);
    } else {
      res.json(channels);
    }
  });

  app.post("/api/social/groups/:groupId/channels", (req, res) => {
    const { name } = req.body;
    db.prepare("INSERT INTO social_channels (group_id, name) VALUES (?, ?)").run(req.params.groupId, name);
    res.json({ success: true });
  });

  app.delete("/api/social/channels/:channelId", (req, res) => {
    db.prepare("DELETE FROM social_channels WHERE id = ?").run(req.params.channelId);
    res.json({ success: true });
  });

  app.put("/api/social/channels/:channelId", (req, res) => {
    const { name } = req.body;
    db.prepare("UPDATE social_channels SET name = ? WHERE id = ?").run(name, req.params.channelId);
    res.json({ success: true });
  });

  app.get("/api/social/groups/:groupId/messages", (req, res) => {
    const { channelId = 'general' } = req.query;
    const messages = db.prepare(`
      SELECT sm.*, p.name as user_name, p.starting_photo_url, u.is_admin, sgm.role as group_role
      FROM social_messages sm
      JOIN profiles p ON sm.user_id = p.user_id
      JOIN users u ON sm.user_id = u.id
      LEFT JOIN social_group_members sgm ON sm.group_id = sgm.group_id AND sm.user_id = sgm.user_id
      WHERE sm.group_id = ? AND sm.channel_id = ?
      ORDER BY sm.created_at DESC
      LIMIT 100
    `).all(req.params.groupId, channelId);
    res.json(messages);
  });

  app.post("/api/social/groups/:groupId/messages", (req, res) => {
    const { userId, content, channelId = 'general', imageUrl } = req.body;
    db.prepare("INSERT INTO social_messages (group_id, user_id, content, channel_id, image_url) VALUES (?, ?, ?, ?, ?)").run(req.params.groupId, userId, content, channelId, imageUrl);
    res.json({ success: true });
  });

  app.get("/api/social/playlists", (req, res) => {
    const playlists = db.prepare(`
      SELECT sp.*, p.name as user_name
      FROM social_playlists sp
      JOIN profiles p ON sp.user_id = p.user_id
      ORDER BY sp.created_at DESC
    `).all();
    res.json(playlists);
  });

  app.post("/api/social/playlists", (req, res) => {
    const { userId, name, url, category } = req.body;
    db.prepare("INSERT INTO social_playlists (user_id, name, url, category) VALUES (?, ?, ?, ?)").run(userId, name, url, category);
    res.json({ success: true });
  });

  app.delete("/api/social/playlists/:id", (req, res) => {
    const { userId } = req.body;
    const playlist = db.prepare("SELECT * FROM social_playlists WHERE id = ?").get(req.params.id) as any;
    const user = db.prepare("SELECT is_admin FROM users WHERE id = ?").get(userId) as any;
    
    if (playlist && (playlist.user_id === userId || user?.is_admin)) {
      db.prepare("DELETE FROM social_playlists WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } else {
      res.status(403).json({ error: "Unauthorized" });
    }
  });

  app.get("/api/social/messages/global", (req, res) => {
    const messages = db.prepare(`
      SELECT sm.*, p.name as user_name, p.starting_photo_url, u.is_admin, u.email
      FROM social_messages sm
      JOIN profiles p ON sm.user_id = p.user_id
      JOIN users u ON sm.user_id = u.id
      WHERE sm.group_id IS NULL
      ORDER BY sm.created_at DESC
      LIMIT 50
    `).all();
    res.json(messages);
  });

  app.post("/api/social/messages/global", (req, res) => {
    const { userId, content, imageUrl } = req.body;
    db.prepare("INSERT INTO social_messages (user_id, content, image_url, group_id) VALUES (?, ?, ?, NULL)").run(userId, content, imageUrl || null);
    res.json({ success: true });
  });

  app.delete("/api/social/messages/:id", (req, res) => {
    const { userId } = req.body;
    const message = db.prepare("SELECT * FROM social_messages WHERE id = ?").get(req.params.id) as any;
    const user = db.prepare("SELECT is_admin FROM users WHERE id = ?").get(userId) as any;

    if (message && (message.user_id === userId || user?.is_admin)) {
      db.prepare("DELETE FROM social_messages WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } else {
      res.status(403).json({ error: "Unauthorized" });
    }
  });

  app.post("/api/admin/promote", (req, res) => {
    const { adminId, targetUserId, targetEmail } = req.body;
    const admin = db.prepare("SELECT is_admin FROM users WHERE id = ?").get(adminId) as any;
    if (admin?.is_admin) {
      if (targetUserId) {
        db.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").run(targetUserId);
      } else if (targetEmail) {
        db.prepare("UPDATE users SET is_admin = 1 WHERE email = ?").run(targetEmail.toLowerCase());
      }
      res.json({ success: true });
    } else {
      res.status(403).json({ error: "Unauthorized" });
    }
  });

  app.post("/api/social/reports", (req, res) => {
    const { userId, dayNumber, whatWorked, whatDidntWork } = req.body;
    db.prepare("INSERT INTO periodic_reports (user_id, day_number, what_worked, what_didnt_work) VALUES (?, ?, ?, ?)").run(userId, dayNumber, whatWorked, whatDidntWork);
    res.json({ success: true });
  });

  app.get("/api/social/reports/:userId", (req, res) => {
    const reports = db.prepare("SELECT * FROM periodic_reports WHERE user_id = ? ORDER BY day_number ASC").all(req.params.userId);
    res.json(reports);
  });

  app.post("/api/social/challenge-phone", (req, res) => {
    const { userId, phone } = req.body;
    const targetUser = db.prepare("SELECT id FROM users WHERE phone = ?").get(phone) as any;
    if (!targetUser) {
      return res.status(404).json({ error: "User with this phone number not found" });
    }
    if (targetUser.id === userId) {
      return res.status(400).json({ error: "You cannot challenge yourself" });
    }
    // Check if already connected
    const existing = db.prepare("SELECT * FROM social_connections WHERE user_id = ? AND connected_user_id = ?").get(userId, targetUser.id);
    if (existing) {
      return res.status(400).json({ error: "Already connected to this user" });
    }
    db.prepare("INSERT INTO social_connections (user_id, connected_user_id) VALUES (?, ?)").run(userId, targetUser.id);
    res.json({ success: true });
  });

  app.get("/api/social/connections/:userId", (req, res) => {
    const connections = db.prepare(`
      SELECT sc.*, p.name, p.starting_photo_url
      FROM social_connections sc
      JOIN profiles p ON sc.connected_user_id = p.user_id
      WHERE sc.user_id = ?
    `).all(req.params.userId);
    res.json(connections);
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

  app.get("/api/recipes/saved/:userId", (req, res) => {
    try {
      const recipes = db.prepare("SELECT * FROM saved_recipes WHERE user_id = ? ORDER BY created_at DESC").all(req.params.userId);
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching saved recipes:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/recipes/save", (req, res) => {
    try {
      const { userId, name, ingredients, instructions, macros } = req.body;
      db.prepare(`
        INSERT INTO saved_recipes (user_id, name, ingredients, instructions, macros)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, name, JSON.stringify(ingredients), instructions, JSON.stringify(macros));
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving recipe:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/recipes/saved/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM saved_recipes WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting saved recipe:", error);
      res.status(500).json({ error: "Internal server error" });
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

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Express Error:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

console.log("Starting server...");
startServer().catch(err => {
  console.error("Failed to start server:", err);
});
