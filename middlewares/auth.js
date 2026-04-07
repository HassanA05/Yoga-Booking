// middlewares/auth.js
import { UserModel } from "../models/userModel.js";

// Attach user from session to req.user and res.locals on every request
export const attachUser = async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      const user = await UserModel.findById(req.session.userId);
      if (user) {
        req.user = user;
        res.locals.user = {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isOrganiser: user.role === "organiser",
        };
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};

// Protect routes that require a logged-in user
export const requireLogin = (req, res, next) => {
  if (!req.user) {
    return res.redirect("/auth/login");
  }
  next();
};

// Protect routes that require organiser role
export const requireOrganiser = (req, res, next) => {
  if (!req.user) {
    return res.redirect("/auth/login");
  }
  if (req.user.role !== "organiser") {
    return res.status(403).render("error", {
      title: "Access Denied",
      message: "You do not have permission to access this page.",
    });
  }
  next();
};
