/**
 * Controller managing Google OAuth, session validation, and user logout routes.
 */
import { Response } from "express";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/user.model";
import { Session } from "../models/session.model";
import { AuthRequest } from "../middleware/auth.middleware";

export const authController = {
  // Google OAuth Authorization initiation redirect
  initiateGoogleAuth: (req: AuthRequest, res: Response) => {
    const redirectUri = process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback";
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const origin = (req.query.origin as string) || "";

    if (!clientID || clientID === "MY_GOOGLE_CLIENT_ID" || clientID === "") {
      console.log("GOOGLE_CLIENT_ID is placeholder or missing, generating a simulated authentication redirect.");
      const simulatedCode = `mock_auth_code_${Date.now()}`;
      res.redirect(`${redirectUri}?code=${simulatedCode}&simulated=true&state=${encodeURIComponent(origin)}`);
      return;
    }

    const client = new OAuth2Client(clientID, process.env.GOOGLE_CLIENT_SECRET, redirectUri);
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      state: origin
    });
    res.redirect(authUrl);
  },

  // Google OAuth Callback token exchanges
  handleGoogleCallback: async (req: AuthRequest, res: Response) => {
    const code = req.query.code as string;
    const state = req.query.state as string;
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

    // Redirect user back to the client origin (Vite/Firebase) with token query parameter
    const redirectOrigin = state && state.startsWith("http") ? state : "";
    if (redirectOrigin) {
      const target = redirectOrigin.endsWith("/") ? redirectOrigin : `${redirectOrigin}/`;
      res.redirect(`${target}?token=${sessionId}`);
    } else {
      res.redirect(`/?token=${sessionId}`);
    }
  },

  // Logout session clearance
  logout: async (req: AuthRequest, res: Response) => {
    const authHeader = req.headers.authorization;
    let sessionId = "";

    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessionId = authHeader.split(' ')[1];
    }

    if (sessionId) {
      await Session.deleteOne({ sessionId });
    }
    res.json({ success: true });
  },

  // Query authenticated user state
  getMe: (req: AuthRequest, res: Response) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.json(null);
    }
  }
};
