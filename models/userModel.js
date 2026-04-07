// models/userModel.js
import { usersDb } from "./_db.js";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export const UserModel = {
  async create({ name, email, password, role = "student" }) {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return usersDb.insert({ name, email, password: hashedPassword, role });
  },

  // Used for seeding only — no password hashing
  async createRaw(user) {
    return usersDb.insert(user);
  },

  async findByEmail(email) {
    return usersDb.findOne({ email });
  },

  async findById(id) {
    return usersDb.findOne({ _id: id });
  },

  async list() {
    return usersDb.find({}).sort({ name: 1 });
  },

  async delete(id) {
    return usersDb.remove({ _id: id }, {});
  },

  async updateRole(id, role) {
    await usersDb.update({ _id: id }, { $set: { role } });
    return this.findById(id);
  },

  async verifyPassword(plaintext, hashed) {
    return bcrypt.compare(plaintext, hashed);
  },
};
