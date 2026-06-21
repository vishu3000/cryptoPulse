import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

// Stub: once vi-auth-sdk tenant keys are available, replace with:
//   const auth = new AuthClient({ secretKey: process.env.AUTH_SECRET_KEY });
//   const user = await auth.me({ cookie: req.headers.cookie });
//   req.userId = user.id;
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const devUserId = req.headers["x-dev-user-id"] as string | undefined;

  if (process.env.NODE_ENV !== "production" && devUserId) {
    req.userId = devUserId;
    return next();
  }

  if (process.env.AUTH_SECRET_KEY) {
    // TODO: replace stub with real vi-auth-sdk call when tenant is registered
    res.status(501).json({ error: { code: "AUTH_NOT_WIRED", message: "Auth integration pending tenant registration." } });
    return;
  }

  // Dev fallback — single user mode before auth is wired
  req.userId = process.env.DEV_USER_ID ?? "dev-user-001";
  next();
}
