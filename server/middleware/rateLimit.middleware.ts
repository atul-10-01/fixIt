import { Request, Response, NextFunction } from 'express';
import { RateLimit } from '../models/rateLimit.model';
import { Issue } from '../models/issue.model';
import { AuthRequest } from './auth.middleware';
import { CONFIG } from '../config/constants';

/**
 * Extract client IP helper. Looks for proxies, load balancers, and falls back to socket.
 */
export const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded : forwarded.split(',');
    return ips[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
};

/**
 * Standard API Route Rate Limiting (Persistent MongoDB backed).
 * Limits requests per User ID (if logged in) or Client IP.
 */
export const generalRateLimiter = (maxRequests = CONFIG.RATE_LIMIT_MAX, windowMs = CONFIG.RATE_LIMIT_WINDOW_MS) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientIp = getClientIp(req);
      const identifier = req.user?.uid ? `uid_${req.user.uid}` : `ip_${clientIp}`;
      const key = `rl:gen:${identifier}`;

      const now = new Date();
      const resetAt = new Date(now.getTime() + windowMs);

      // Find or create rate limit record
      let record = await RateLimit.findOne({ key });

      if (!record) {
        // Create new record
        record = await RateLimit.create({ key, count: 1, resetAt });
      } else {
        // If expired (failsafe check if TTL index has delay), reset
        if (record.resetAt <= now) {
          record.count = 1;
          record.resetAt = resetAt;
          await record.save();
        } else if (record.count >= maxRequests) {
          // Send 429 and rate limit headers
          res.setHeader('Retry-After', Math.ceil((record.resetAt.getTime() - now.getTime()) / 1000));
          res.status(429).json({
            error: "Too many requests. Please slow down.",
            resetTime: record.resetAt
          });
          return;
        } else {
          record.count += 1;
          await record.save();
        }
      }

      // Append standard rate-limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt.getTime() / 1000));

      next();
    } catch (err) {
      console.error("Rate limiter failure, passing through to prevent API lock:", err);
      next();
    }
  };
};

/**
 * Incident reporting spam protector.
 * Limits account AND client IP to K uploads per week to protect Gemini API quota.
 */
export const incidentUploadSpamLimiter = (maxPerWeek = CONFIG.MAX_ISSUES_PER_WEEK) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Authenticated user checks
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: "Sign in required to report incidents." });
        return;
      }

      const clientIp = getClientIp(req);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // 2. Query issue counts for BOTH User UID and IP in last 7 days
      const countByUser = await Issue.countDocuments({
        reportedBy: user.uid,
        reportedAt: { $gte: oneWeekAgo }
      });

      const countByIp = await Issue.countDocuments({
        reporterIp: clientIp,
        reportedAt: { $gte: oneWeekAgo }
      });

      // 3. Block if either threshold is breached
      if (countByUser >= maxPerWeek) {
        res.status(429).json({
          error: "Spam Limit Reached",
          message: `Your account has reached the maximum quota of ${maxPerWeek} incident reports per week. Thank you for your civic contributions — please wait before reporting another.`
        });
        return;
      }

      if (countByIp >= maxPerWeek) {
        res.status(429).json({
          error: "Spam Limit Reached",
          message: `This location network IP has reached the maximum quota of ${maxPerWeek} incident reports per week. This prevents automated spam bots and protects our AI resources.`
        });
        return;
      }

      next();
    } catch (err) {
      console.error("Spam limiter failure, passing through to keep app available:", err);
      next();
    }
  };
};
