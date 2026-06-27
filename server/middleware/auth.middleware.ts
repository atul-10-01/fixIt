import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { Session } from '../models/session.model';

export interface AuthRequest extends Request {
  user?: any;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessionId = req.cookies?.fixit_sid;
    if (!sessionId) {
      res.status(401).json({ error: "Authentication session required. Please sign in." });
      return;
    }

    const session = await Session.findOne({
      sessionId,
      expiresAt: { $gt: new Date() }
    });
    
    if (!session) {
      res.clearCookie("fixit_sid");
      res.status(401).json({ error: "Session expired or invalid. Please sign in again." });
      return;
    }

    const user = await User.findOne({ uid: session.uid });
    if (!user) {
      res.clearCookie("fixit_sid");
      res.status(401).json({ error: "User profile not found. Access denied." });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid session. Please sign in again." });
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessionId = req.cookies?.fixit_sid;
    if (sessionId) {
      const session = await Session.findOne({
        sessionId,
        expiresAt: { $gt: new Date() }
      });
      if (session) {
        const user = await User.findOne({ uid: session.uid });
        if (user) {
          req.user = user;
        }
      }
    }
  } catch (err) {
    // Continue anonymously if session parsing fails
  }
  next();
};
