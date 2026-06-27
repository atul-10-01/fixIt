import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';

export interface AuthRequest extends Request {
  user?: any;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.fixit_token;
    if (!token) {
      res.status(401).json({ error: "Authentication token required. Please sign in." });
      return;
    }

    const secret = process.env.JWT_SECRET || 'iamgoingtowin';
    const decoded = jwt.verify(token, secret) as { uid: string };
    
    const user = await User.findOne({ uid: decoded.uid });
    if (!user) {
      res.status(401).json({ error: "User profile not found. Access denied." });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid session or authentication expired." });
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.fixit_token;
    if (token) {
      const secret = process.env.JWT_SECRET || 'iamgoingtowin';
      const decoded = jwt.verify(token, secret) as { uid: string };
      const user = await User.findOne({ uid: decoded.uid });
      if (user) {
        req.user = user;
      }
    }
  } catch (err) {
    // Continue anonymously if token is invalid or parsing fails
  }
  next();
};
