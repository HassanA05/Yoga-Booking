// routes/auth.js
import { Router } from "express";
import { getLogin, postLogin, getRegister, postRegister, logout } from "../controllers/authController.js";

const router = Router();

router.get("/login", getLogin);
router.post("/login", postLogin);
router.get("/register", getRegister);
router.post("/register", postRegister);
router.get("/logout", logout);

export default router;
