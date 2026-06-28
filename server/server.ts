/**
 * Main application entrypoint configuring middlewares, routing pathways, and database setup.
 */
import express from "express";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import { User } from "./models/user.model";
import { Issue } from "./models/issue.model";
import { optionalAuth } from "./middleware/auth.middleware";
import { generalRateLimiter } from "./middleware/rateLimit.middleware";
import { CONFIG } from "./config/constants";
import { generateSeedIssues, SEED_USERS } from "../src/utils/seedData";
import apiRouter from "./routes/index";

dotenv.config();

const app = express();
const PORT = CONFIG.PORT;

// Mount cookie parser middleware
app.use(cookieParser());

// Increase JSON body limit for Base64 image transfers
app.use(express.json({ limit: "50mb" }));

// Mount global API rate limiter (100 requests per 15 mins) and auth verification
app.use("/api", optionalAuth, generalRateLimiter());

// Mount the aggregated API router
app.use("/api", apiRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  const usingRealGemini = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
  res.json({ status: "ok", usingRealGemini: !!usingRealGemini });
});

// Configure Vite or Static Asset delivery
async function bootstrap() {
  // Connect to MongoDB Database
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/fixit";
  console.log("Connecting to MongoDB Database at:", mongoUri.split("@").pop()); // Log only the host block for safety
  await mongoose.connect(mongoUri);
  console.log("=========================================");
  console.log("🟢 DATABASE CONNECTION SUCCESSFUL!");
  console.log(`🟢 Connected to MongoDB host: ${mongoose.connection.host}`);
  console.log(`🟢 Active Database: ${mongoose.connection.name}`);
  console.log("=========================================");

  // Seed mock data if collection is empty
  const issueCount = await Issue.countDocuments();
  if (issueCount === 0) {
    console.log("Database is empty. Seeding initial issues & users...");
    
    // Seed users
    await User.deleteMany({});
    for (const u of SEED_USERS) {
      await User.create({
        uid: u.uid,
        displayName: u.displayName,
        photoURL: u.photoURL,
        email: u.email,
        points: u.points,
        level: u.level,
        badges: u.badges,
        area: u.area,
        joinedAt: new Date(u.joinedAt),
        stats: u.stats,
        role: 'citizen'
      });
    }
    
    // Seed issues
    const seedIssues = generateSeedIssues();
    await Issue.deleteMany({});
    for (const iss of seedIssues) {
      // Map Date strings to Date objects
      const dbIssue = {
        ...iss,
        reportedAt: new Date(iss.reportedAt),
        verifications: iss.verifications,
        comments: iss.comments.map(c => ({
          ...c,
          timestamp: new Date(c.timestamp)
        })),
        agentHistory: iss.agentHistory.map(h => ({
          ...h,
          timestamp: new Date(h.timestamp)
        })),
        escalatedAt: iss.escalatedAt ? new Date(iss.escalatedAt) : undefined,
        resolvedAt: iss.resolvedAt ? new Date(iss.resolvedAt) : undefined,
        adoptedDate: iss.adoptedDate ? new Date(iss.adoptedDate) : undefined
      };
      await Issue.create(dbIssue);
    }
    console.log(`Seeding completed. Inserted ${SEED_USERS.length} users and ${seedIssues.length} issues.`);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static files serving from dist/.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

bootstrap().catch(err => {
  console.error("Failed to bootstrap fullstack server:", err);
});
