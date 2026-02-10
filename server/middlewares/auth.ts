import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    // ✅ ATTACH USER CONTEXT
    req.userId = session.user.id;
    req.user = session.user; // 👈 THIS IS WHAT WAS MISSING

    next();
  } catch (error: any) {
    console.log(error);
    res.status(401).json({ message: error.code || error.message });
  }
};
