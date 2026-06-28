/**
 * Express middleware verifying user session tokens and attaching user context to requests.
 */
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { Session } from '../models/session.model';

export interface AuthRequest extends Request {
  user?: any;
}

// Extract session token exclusively from the Authorization Bearer header
function getSessionId(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return undefined;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessionId = getSessionId(req);
    if (!sessionId) {
      res.status(401).json({ error: "Authentication token required. Please sign in." });
      return;
    }

    const session = await Session.findOne({
      sessionId,
      expiresAt: { $gt: new Date() }
    });
    
    if (!session) {
      res.status(401).json({ error: "Session expired or invalid. Please sign in again." });
      return;
    }

    const user = await User.findOne({ uid: session.uid });
    if (!user) {
      res.status(401).json({ error: "User profile not found. Access denied." });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid session token. Please sign in again." });
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessionId = getSessionId(req);
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
    // Continue anonymously if token parsing fails
  }
  next();
};
