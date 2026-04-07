// index.js
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import dotenv from "dotenv";
import mustacheExpress from "mustache-express";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import courseApiRoutes from "./routes/courses.js";
import sessionApiRoutes from "./routes/sessions.js";
import bookingApiRoutes from "./routes/bookings.js";
import viewRoutes from "./routes/views.js";
import organiserRoutes from "./routes/organiser.js";

import { attachUser } from "./middlewares/auth.js";
import { flashMiddleware } from "./middlewares/flash.js";
import { initDb } from "./models/_db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// ── View engine ────────────────────────────────────────────────────────────
app.engine(
  "mustache",
  mustacheExpress(path.join(__dirname, "views", "partials"), ".mustache")
);
app.set("view engine", "mustache");
app.set("views", path.join(__dirname, "views"));

// ── Body parsing ───────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// ── Session ────────────────────────────────────────────────────────────────
app.use(
  session({
    secret: process.env.SESSION_SECRET || "yoga-studio-secret-key-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// ── Static files ───────────────────────────────────────────────────────────
app.use("/static", express.static(path.join(__dirname, "public")));

// ── Attach user from session on every request ──────────────────────────────
app.use(attachUser);

// Flash messages — read once, expose to all templates via res.locals, then clear
app.use(flashMiddleware);

// ── Inject current year into every template ────────────────────────────────
app.use((req, res, next) => {
  res.locals.year = new Date().getFullYear();
  next();
});

// ── Health check ───────────────────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ ok: true }));

// ── JSON API routes (prefixed /api to avoid clash with SSR routes) ─────────
app.use("/api/courses", courseApiRoutes);
app.use("/api/sessions", sessionApiRoutes);
app.use("/api/bookings", bookingApiRoutes);

// ── SSR routes ─────────────────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/organiser", organiserRoutes);
app.use("/", viewRoutes);

// ── Error handlers ─────────────────────────────────────────────────────────
export const not_found = (req, res) =>
  res.status(404).type("text/plain").send("404 Not found.");

export const server_error = (err, req, res, next) => {
  console.error(err);
  res.status(500).render("error", {
    title: "Server Error",
    message: "Something went wrong. Please try again.",
  });
};

app.use(not_found);
app.use(server_error);

// ── Start server (not during tests) ───────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  await initDb();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () =>
    console.log(`Yoga booking running on http://localhost:${PORT}`)
  );
}
