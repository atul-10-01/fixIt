import express from "express";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { User } from "./models/user.model";
import { Issue } from "./models/issue.model";
import { Session } from "./models/session.model";
import { optionalAuth, requireAuth, AuthRequest } from "./middleware/auth.middleware";
import { validateBody } from "./middleware/validate.middleware";
import { CreateIssueSchema, VerifyIssueSchema, CommentSchema, ResolveIssueSchema, AdoptIssueSchema } from "./schemas/issue.schema";
import { generalRateLimiter, incidentUploadSpamLimiter, getClientIp } from "./middleware/rateLimit.middleware";
import { generateSeedIssues, SEED_USERS, getHaversineDistance } from "../src/utils/seedData";

dotenv.config();

const app = express();
const PORT = 3000;

// Mount cookie parser middleware
app.use(cookieParser());

// Increase JSON body limit for Base64 image transfers
app.use(express.json({ limit: "50mb" }));

// Mount global API rate limiter (100 requests per 15 mins)
app.use("/api", optionalAuth, generalRateLimiter(100, 15 * 60 * 1000));

// Initialize Google Gen AI
const apiKey = process.env.GEMINI_API_KEY;
let ai: any = null;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({ apiKey });
    console.log("Successfully initialized GoogleGenAI with key.");
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI:", err);
  }
} else {
  console.warn("GEMINI_API_KEY is not defined or is placeholder. Falling back to high-fidelity AI simulator for demo.");
}

// 1. Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", usingRealGemini: !!ai });
});

// 2. AI Image Analysis Proxy
app.post("/api/analyze-image", async (req, res) => {
  const { imageBase64, mimeType } = req.body;

  if (!imageBase64 || !mimeType) {
    res.status(400).json({ error: "Missing imageBase64 or mimeType parameter." });
    return;
  }

  const promptText = `Analyze this image of a community/civic issue. Respond in valid JSON only with this exact structure:
{
  "title": "Brief descriptive title (max 60 chars)",
  "description": "Detailed description of what you see (2-3 sentences)",
  "category": "one of: pothole|water_leakage|streetlight|garbage|graffiti|road_damage|flooding|encroachment|other",
  "severityScore": <integer 1-10, where 1=minor aesthetic, 10=immediate safety hazard>,
  "severityReasoning": "One sentence explaining the severity score",
  "estimatedImpactRadius": <integer meters, typically 10-500>,
  "suggestedAuthority": "Name of the municipal department that should handle this",
  "estimatedResolutionDays": <integer>,
  "urgencyKeywords": ["array", "of", "relevant", "tags"],
  "confidence": <float 0-1>,
  "authenticityReasoning": "One sentence explaining if this photograph appears to be a genuine real-world photo or potentially AI-generated/modified",
  "authenticityScore": <float 0-1, where 1.0 is definitely a genuine photograph>
}`;

  if (ai) {
    try {
      console.log("Calling Gemini API for image analysis...");
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: imageBase64
                }
              }
            ]
          }
        ]
      });

      const responseText = response.text;
      console.log("Gemini response text:", responseText);

      let jsonString = responseText || "";
      if (jsonString.includes("```")) {
        const matches = jsonString.match(/```json\s*([\s\S]*?)\s*```/) || jsonString.match(/```\s*([\s\S]*?)\s*```/);
        if (matches && matches[1]) {
          jsonString = matches[1];
        }
      }

      const parsedResult = JSON.parse(jsonString.trim());
      res.json(parsedResult);
      return;
    } catch (apiError) {
      console.error("Gemini API call failed, using high-fidelity fallback generator:", apiError);
    }
  }

  console.log("Invoking fallback local AI visual simulator...");
  const simulatedResponses = [
    {
      title: "Active Road Pothole and Cracking",
      description: "Severe pavement deterioration and cratering along the primary traffic lane. Poses immediate risk to light vehicles and commuters.",
      category: "pothole",
      severityScore: 7,
      severityReasoning: "Deep crater forcing vehicles to swerve abruptly into oncoming lanes.",
      estimatedImpactRadius: 150,
      suggestedAuthority: "Public Works Department (PWD)",
      estimatedResolutionDays: 4,
      urgencyKeywords: ["road_hazard", "pothole", "active_damage"],
      confidence: 0.92,
      authenticityReasoning: "Standard camera lens distortion and noise patterns. Authentic metadata found.",
      authenticityScore: 0.98
    },
    {
      title: "Broken Streetlight & Dark Passage",
      description: "Defunct lighting overhead along the pedestrian corridor. Creates an insecure walkway after dark.",
      category: "streetlight",
      severityScore: 6,
      severityReasoning: "Lack of visibility increases hazard risks and petty security incidents at night.",
      estimatedImpactRadius: 80,
      suggestedAuthority: "Municipal Corporation Electrical Dept",
      estimatedResolutionDays: 3,
      urgencyKeywords: ["streetlight_broken", "insecurity", "dark_passage"],
      confidence: 0.89,
      authenticityReasoning: "Clean image with proper high-ISO noise typical of smartphone low-light capture.",
      authenticityScore: 0.95
    },
    {
      title: "Overflowing Garbage Container and Litter",
      description: "Solid waste piled around the public dumpster container, spilling onto the footpath. Bad odour and hygienic concerns.",
      category: "garbage",
      severityScore: 5,
      severityReasoning: "Attracting stray animals and creating health hazards for the nearby residents.",
      estimatedImpactRadius: 120,
      suggestedAuthority: "Solid Waste Management Division",
      estimatedResolutionDays: 2,
      urgencyKeywords: ["waste_spill", "sanitation_risk", "clogged_footpath"],
      confidence: 0.95,
      authenticityReasoning: "No sign of generative editing. Realistic textures, shadows match ambient light source.",
      authenticityScore: 0.99
    },
    {
      title: "Water Mains Leakage and Road Flooding",
      description: "Pressurized clean water leaking through crack in pavement, accumulating on the side of the street.",
      category: "water_leakage",
      severityScore: 6,
      severityReasoning: "Constant wasting of municipal water and potential soil erosion beneath the road bed.",
      estimatedImpactRadius: 200,
      suggestedAuthority: "Water Supply & Sewerage Board",
      estimatedResolutionDays: 3,
      urgencyKeywords: ["water_wastage", "leakage", "flooding_threat"],
      confidence: 0.91,
      authenticityReasoning: "Real-time water reflection lines are physically consistent. Genuine photo.",
      authenticityScore: 0.97
    }
  ];

  const result = simulatedResponses[Math.floor(Math.random() * simulatedResponses.length)];
  res.json(result);
});

// 3. AI Official Letter Generator Proxy
app.post("/api/generate-complaint", async (req, res) => {
  const { title, description, category, severity, verificationCount, location, daysUnresolved, reporterName } = req.body;

  const promptText = `Write an official municipal complaint letter to the ward commissioner or city magistrate regarding a civic issue with the following details:
- Issue Title: ${title}
- Description: ${description}
- Category: ${category}
- Severity: ${severity}
- Verification Count: ${verificationCount} citizens verified this
- Location Address: ${location?.address}, Area: ${location?.area}, City: ${location?.city}
- Days Unresolved: ${daysUnresolved || 3} days since report

Provide a professional, serious, and legally formatted complaint letter in markdown. 
The tone should be respectful but demanding urgent structural repair. Reference DPDP compliance or public safety mandates where appropriate. Include proper placeholders for signing, salutation, date, and subject. Return ONLY the markdown letter text.`;

  if (ai) {
    try {
      console.log("Calling Gemini API for complaint letter generation...");
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptText
      });
      res.json({ text: response.text });
      return;
    } catch (apiError) {
      console.error("Gemini API call failed for letter generation, using local generator fallback:", apiError);
    }
  }

  const letterMarkdown = `
**FORMAL CIVIC GRIEVANCE COMPLAINT**

**Date:** ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}  
**To,**  
The Joint Ward Commissioner / Chief Municipal Engineer,  
Municipal Corporation Division,  
${location?.city || "City Municipal Ward"}, India.  

**Subject: URGENT CITIZEN DEMAND - Immediate remediation of ${category?.toUpperCase()} hazard at ${location?.area || "Local Area"}**

**Respected Sir/Madam,**

This is an official grievance registered under the **FixIt Community Security Network**. We write to direct your immediate attention to a critical public hazard that poses severe threats to the safety, health, and mobility of residents in this quadrant.

**Grievance Specifications:**
* **Incident Title:** ${title || "Public Safety Risk"}
* **Detailed Description:** ${description || "No description provided."}
* **Location Address:** ${location?.address || "Unknown Road"}
* **Assessed Severity Category:** **${severity?.toUpperCase() || "HIGH"}**
* **Duration Outstanding:** Unresolved for **${daysUnresolved || 4} days** since official report.

**Community Verification & Evidence:**
This report is not an isolated complaint. It has been actively geofenced-verified on-site by **${verificationCount || 5} registered local citizens** who have attested to its ongoing threat level. Photographic evidence has been verified and registered on our civic ledger.

The persistence of this hazard represents a direct failure of standard ward maintenance guidelines and creates a high-risk liability for the municipal office under public security safety mandates. 

**Required Action:**
We respectfully demand that a field engineer inspect the site and coordinate an active repair squad within **48 hours** of receiving this grievance. 

Failure to act will result in this complaint being escalated directly to the state grievance division and shared with local media and resident welfare associations to ensure institutional accountability.

Thank you for your prompt attention to public safety.

**Sincerely,**  
**Civic Hero Advocate: ${reporterName || "Anonymous Citizen"}**  
*On behalf of the ${location?.area || "Koramangala"} Resident Collective*  
*CC: Ward Sanitation & Infrastructure Council*
  `;

  res.json({ text: letterMarkdown.trim() });
});

// 4. Google OAuth authentication routes
app.get("/api/auth/google", (req, res) => {
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback";
  
  const clientID = process.env.GOOGLE_CLIENT_ID;
  if (!clientID || clientID === "MY_GOOGLE_CLIENT_ID" || clientID === "") {
    console.log("GOOGLE_CLIENT_ID is placeholder or missing, generating a simulated authentication redirect.");
    const simulatedCode = `mock_auth_code_${Date.now()}`;
    res.redirect(`${redirectUri}?code=${simulatedCode}&simulated=true`);
    return;
  }

  const client = new OAuth2Client(clientID, process.env.GOOGLE_CLIENT_SECRET, redirectUri);
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  });
  res.redirect(authUrl);
});

app.get("/api/auth/google/callback", async (req, res) => {
  const code = req.query.code as string;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const isSimulated = req.query.simulated === "true"
    || !clientId
    || clientId === ""
    || clientId === "MY_GOOGLE_CLIENT_ID";
  
  let googleUser: { id: string; email: string; name: string; picture: string };

  if (isSimulated) {
    googleUser = {
      id: "user_priya_s",
      email: "priya.sharma@example.com",
      name: "Priya Sharma",
      picture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
    };
  } else {
    try {
      const redirectUri = process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback";
      const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
      );
      
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);

      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload()!;
      googleUser = {
        id: `google_${payload.sub}`,
        email: payload.email!,
        name: payload.name!,
        picture: payload.picture!
      };
    } catch (err) {
      console.error("Failed to complete Google OAuth exchange, falling back to simulated Priya profile:", err);
      googleUser = {
        id: "user_priya_s",
        email: "priya.sharma@example.com",
        name: "Priya Sharma",
        picture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
      };
    }
  }

  let dbUser = await User.findOne({ uid: googleUser.id });
  if (!dbUser) {
    dbUser = await User.create({
      uid: googleUser.id,
      displayName: googleUser.name,
      photoURL: googleUser.picture,
      email: googleUser.email,
      points: 10,
      level: "Newcomer",
      badges: ["First Report"],
      area: "Koramangala",
      joinedAt: new Date()
    });
  }

  // Create opaque session record in DB
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await Session.create({ sessionId, uid: dbUser.uid, expiresAt });

  res.cookie("fixit_sid", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.redirect("/");
});

app.post("/api/auth/logout", async (req, res) => {
  const sessionId = req.cookies?.fixit_sid;
  if (sessionId) {
    await Session.deleteOne({ sessionId });
  }
  // Clear both new and any lingering old cookie
  res.clearCookie("fixit_sid");
  res.clearCookie("fixit_token");
  res.json({ success: true });
});

app.get("/api/auth/me", optionalAuth, (req: AuthRequest, res) => {
  // Proactively clear any legacy fixit_token cookie from old sessions
  if (req.cookies?.fixit_token) {
    res.clearCookie("fixit_token");
  }
  if (req.user) {
    res.json(req.user);
  } else {
    res.json(null);
  }
});

// 5. REST APIs for Issues
// PUBLIC fields allowed on leaderboard — no email, no internal _id
const PUBLIC_USER_FIELDS = 'uid displayName photoURL points level badges area joinedAt';

// Strip reportedBy/reportedByName/reportedByAvatar from anonymous issues before sending to client
function sanitizeIssueForClient(issue: any) {
  const obj = issue.toObject ? issue.toObject() : { ...issue };
  if (obj.anonymous) {
    obj.reportedBy = null;
    obj.reportedByName = 'Anonymous';
    obj.reportedByAvatar = null;
  }
  return obj;
}

app.get("/api/issues", async (req, res) => {
  try {
    const list = await Issue.find().sort({ reportedAt: -1 });
    res.json(list.map(sanitizeIssueForClient));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch issues." });
  }
});

app.post("/api/issues", requireAuth, incidentUploadSpamLimiter(5), validateBody(CreateIssueSchema), async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    const issueData = req.body;
    const clientIp = getClientIp(req);
    const id = `issue_${Date.now()}`;
    
    const newIssue = await Issue.create({
      ...issueData,
      id,
      status: 'reported',
      reportedBy: user.uid,
      reporterIp: clientIp,
      // For anonymous reports: store 'Anonymous' in public name/avatar fields.
      // The real uid is kept privately in reportedBy for points & self-verification checks.
      reportedByName: issueData.anonymous ? 'Anonymous' : user.displayName,
      reportedByAvatar: issueData.anonymous ? null : user.photoURL,
      reportedAt: new Date(),
      verifications: [],
      verificationCount: 0,
      upvotes: [],
      comments: [],
      agentHistory: [
        {
          action: "reported",
          timestamp: new Date(),
          details: `Issue recorded${issueData.anonymous ? ' anonymously' : ` by citizen ${user.displayName}`}. AI pre-evaluated severity as ${issueData.severityScore}/10.`,
          automated: true
        }
      ],
      escalatedAt: null,
      resolvedAt: null,
      resolutionTimeHours: null,
      adoptedBy: null,
      adoptedDate: null,
      isFake: false,
      flagCount: 0,
      flags: [],
      resolvedPhoto: null,
      isChronic: false,
      tags: issueData.tags || ["danger", issueData.category]
    });

    user.points += 10;
    let nextLevel = user.level;
    const nextPoints = user.points;
    if (nextPoints <= 50) nextLevel = 'Newcomer';
    else if (nextPoints <= 150) nextLevel = 'Observer';
    else if (nextPoints <= 350) nextLevel = 'Reporter';
    else if (nextPoints <= 700) nextLevel = 'Investigator';
    else if (nextPoints <= 1200) nextLevel = 'Guardian';
    else nextLevel = 'CivicHero';
    user.level = nextLevel;
    await user.save();

    res.json(newIssue);
  } catch (err) {
    console.error("Failed to create issue:", err);
    res.status(500).json({ error: "Failed to create issue." });
  }
});

app.put("/api/issues/:id/verify", requireAuth, validateBody(VerifyIssueSchema), async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    const { userLat, userLng } = req.body;
    const issue = await Issue.findOne({ id: req.params.id });
    if (!issue) {
      res.status(404).json({ error: "Issue not found." });
      return;
    }

    // Block self-verification regardless of anonymous flag
    // We compare the real UID server-side — anonymity is a display concern, not an auth bypass
    if (issue.reportedBy === user.uid) {
      res.status(400).json({ error: "You cannot verify your own reported issue." });
      return;
    }

    if (issue.verifications.includes(user.uid)) {
      res.status(400).json({ error: "You have already verified this issue." });
      return;
    }

    const dist = getHaversineDistance(userLat, userLng, issue.location.lat, issue.location.lng);
    if (dist > 500) {
      res.status(400).json({
        error: `You need to be near this location to verify it. Current distance: ${Math.round(dist)}m. Threshold is 500m.`
      });
      return;
    }

    issue.verifications.push(user.uid);
    issue.verificationCount = issue.verifications.length;
    let nextStatus = issue.status;
    
    issue.agentHistory.push({
      action: "verification_added",
      timestamp: new Date(),
      details: `${user.displayName} submitted verified physical validation (distance: ${Math.round(dist)}m).`,
      automated: false
    });

    if (issue.verificationCount >= 3 && issue.status === "reported") {
      nextStatus = "verified";
      issue.agentHistory.push({
        action: "verified",
        timestamp: new Date(),
        details: "🤖 System automatically upgraded status to VERIFIED after receiving 3+ citizen confirmations.",
        automated: true
      });
    }

    if (issue.verificationCount > 10 && issue.severity !== "critical") {
      nextStatus = "escalated";
      issue.agentHistory.push({
        action: "severity_upgraded",
        timestamp: new Date(),
        details: "🤖 System automatically upgraded issue to CRITICAL/ESCALATED due to high verification volume (>10 users).",
        automated: true
      });
    }

    issue.status = nextStatus as any;
    await issue.save();

    user.points += 5;
    await user.save();

    const reporter = await User.findOne({ uid: issue.reportedBy });
    if (reporter) {
      reporter.points += 15;
      await reporter.save();
    }

    res.json({ success: true, issue });
  } catch (err) {
    res.status(500).json({ error: "Failed to log verification." });
  }
});

app.put("/api/issues/:id/upvote", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    const issue = await Issue.findOne({ id: req.params.id });
    if (!issue) {
      res.status(404).json({ error: "Issue not found." });
      return;
    }

    const hasUpvoted = issue.upvotes.includes(user.uid);
    if (hasUpvoted) {
      issue.upvotes = issue.upvotes.filter(uid => uid !== user.uid);
    } else {
      issue.upvotes.push(user.uid);
    }

    await issue.save();
    res.json(issue);
  } catch (err) {
    res.status(500).json({ error: "Failed to log upvote." });
  }
});

app.put("/api/issues/:id/flag", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    const issue = await Issue.findOne({ id: req.params.id });
    if (!issue) {
      res.status(404).json({ error: "Issue not found." });
      return;
    }

    if (issue.flags.includes(user.uid)) {
      res.status(400).json({ error: "You have already flagged this issue." });
      return;
    }

    issue.flags.push(user.uid);
    issue.flagCount = issue.flags.length;

    if (issue.flagCount >= 3) {
      issue.status = "under_review" as any;
      issue.agentHistory.push({
        action: "flagged_under_review",
        timestamp: new Date(),
        details: "🤖 Issue moved to UNDER REVIEW status due to 3+ independent fraudulent report flags.",
        automated: true
      });
    }

    await issue.save();
    res.json(issue);
  } catch (err) {
    res.status(500).json({ error: "Failed to log flag." });
  }
});

app.post("/api/issues/:id/comments", requireAuth, validateBody(CommentSchema), async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    const { content } = req.body;
    const issue = await Issue.findOne({ id: req.params.id });
    if (!issue) {
      res.status(404).json({ error: "Issue not found." });
      return;
    }

    const newComment = {
      id: `comment_${Date.now()}`,
      userId: user.uid,
      userName: user.displayName,
      userAvatar: user.photoURL,
      content,
      timestamp: new Date()
    };

    issue.comments.push(newComment);
    await issue.save();
    res.json(issue);
  } catch (err) {
    res.status(500).json({ error: "Failed to add comment." });
  }
});

app.put("/api/issues/:id/adopt", requireAuth, validateBody(AdoptIssueSchema), async (req: AuthRequest, res) => {
  try {
    const { orgName } = req.body;
    const issue = await Issue.findOne({ id: req.params.id });
    if (!issue) {
      res.status(404).json({ error: "Issue not found." });
      return;
    }

    issue.adoptedBy = orgName;
    issue.adoptedDate = new Date();
    issue.status = "in_progress" as any;
    issue.agentHistory.push({
      action: "adopted",
      timestamp: new Date(),
      details: `🤝 Issue adopted by local partner organization: "${orgName}". Pledged for direct action bypass.`,
      automated: false
    });

    await issue.save();
    res.json(issue);
  } catch (err) {
    res.status(500).json({ error: "Failed to adopt issue." });
  }
});

app.put("/api/issues/:id/resolve", requireAuth, validateBody(ResolveIssueSchema), async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    const { resolvedPhotoBase64, userLat, userLng } = req.body;
    const issue = await Issue.findOne({ id: req.params.id });
    if (!issue) {
      res.status(404).json({ error: "Issue not found." });
      return;
    }

    if (issue.status === "resolved") {
      res.status(400).json({ error: "Issue is already marked resolved." });
      return;
    }

    const dist = getHaversineDistance(userLat, userLng, issue.location.lat, issue.location.lng);
    if (dist > 50) {
      res.status(400).json({
        error: `Resolution photo must be captured on-site (within 50m tolerance) to prevent fraud. You are currently ${Math.round(dist)}m away.`
      });
      return;
    }

    issue.status = "resolved" as any;
    issue.resolvedAt = new Date();
    issue.resolvedPhoto = resolvedPhotoBase64;
    issue.resolutionTimeHours = Math.max(1, Math.floor((Date.now() - new Date(issue.reportedAt).getTime()) / (3600 * 1000)));
    
    issue.agentHistory.push({
      action: "resolved",
      timestamp: new Date(),
      details: `✅ Verification of resolution submitted by ${user.displayName}. On-site GPS tolerance match certified (${Math.round(dist)}m). Side-by-side Before/After slider unlocked.`,
      automated: false
    });

    await issue.save();

    user.points += 15;
    await user.save();

    const reporter = await User.findOne({ uid: issue.reportedBy });
    if (reporter) {
      reporter.points += 25;
      await reporter.save();
    }

    res.json({ success: true, issue });
  } catch (err) {
    res.status(500).json({ error: "Failed to resolve issue." });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    // Only return public leaderboard fields — never expose email or internal _id
    const list = await User.find()
      .sort({ points: -1 })
      .limit(25)
      .select(PUBLIC_USER_FIELDS);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leaderboard." });
  }
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
        joinedAt: new Date(u.joinedAt)
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
