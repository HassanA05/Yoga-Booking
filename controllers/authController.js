// controllers/authController.js
import { UserModel } from "../models/userModel.js";

export const getLogin = (req, res) => {
  res.render("auth/login", { title: "Login" });
};

export const postLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.session.flash = { error: "Email and password are required." };
    return res.redirect("/auth/login");
  }

  try {
    const user = await UserModel.findByEmail(email.trim().toLowerCase());
    if (!user) {
      req.session.flash = { error: "Invalid email or password." };
      return res.redirect("/auth/login");
    }

    const valid = await UserModel.verifyPassword(password, user.password);
    if (!valid) {
      req.session.flash = { error: "Invalid email or password." };
      return res.redirect("/auth/login");
    }

    req.session.userId = user._id;
    req.session.flash = { success: `Welcome back, ${user.name}!` };

    if (user.role === "organiser") return res.redirect("/organiser");
    return res.redirect("/");
  } catch (err) {
    req.session.flash = { error: "Something went wrong. Please try again." };
    return res.redirect("/auth/login");
  }
};

export const getRegister = (req, res) => {
  res.render("auth/register", { title: "Register" });
};

export const postRegister = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password) {
    req.session.flash = { error: "All fields are required." };
    return res.redirect("/auth/register");
  }

  if (password !== confirmPassword) {
    req.session.flash = { error: "Passwords do not match." };
    return res.redirect("/auth/register");
  }

  if (password.length < 8) {
    req.session.flash = { error: "Password must be at least 8 characters." };
    return res.redirect("/auth/register");
  }

  try {
    const existing = await UserModel.findByEmail(email.trim().toLowerCase());
    if (existing) {
      req.session.flash = { error: "An account with that email already exists." };
      return res.redirect("/auth/register");
    }

    const user = await UserModel.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: "student",
    });

    req.session.userId = user._id;
    req.session.flash = { success: `Account created! Welcome, ${user.name}.` };
    return res.redirect("/");
  } catch (err) {
    req.session.flash = { error: "Registration failed. Please try again." };
    return res.redirect("/auth/register");
  }
};

export const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/auth/login");
  });
};
