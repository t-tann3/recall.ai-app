import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { db } from "../store/db.js";
import { toPublicHiringManager } from "../models/hiringManager.js";

const SALT_ROUNDS = 10;
const TOKEN_TTL = "7d";

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export function signToken(hiringManager) {
  return jwt.sign(
    {
      sub: hiringManager.id,
      email: hiringManager.email,
      role: "hiring_manager",
    },
    config.auth.jwtSecret,
    { expiresIn: TOKEN_TTL },
  );
}

export function verifyToken(token) {
  return jwt.verify(token, config.auth.jwtSecret);
}

export async function signupHiringManager({ name, email, password, team, title }) {
  if (!name?.trim() || !email?.trim() || !password) {
    throw Object.assign(new Error("name, email, and password are required"), { status: 400 });
  }
  if (password.length < 8) {
    throw Object.assign(new Error("password must be at least 8 characters"), { status: 400 });
  }
  if (db.findHiringManagerByEmail(email)) {
    throw Object.assign(new Error("an account with this email already exists"), { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const hiringManager = db.addHiringManager({
    name: name.trim(),
    email,
    passwordHash,
    team: team ?? null,
    title: title ?? null,
  });

  const token = signToken(hiringManager);
  return { token, hiringManager: toPublicHiringManager(hiringManager) };
}

export async function loginHiringManager({ email, password }) {
  if (!email?.trim() || !password) {
    throw Object.assign(new Error("email and password are required"), { status: 400 });
  }

  const hiringManager = db.findHiringManagerByEmail(email);
  if (!hiringManager?.passwordHash) {
    throw Object.assign(new Error("invalid email or password"), { status: 401 });
  }

  const valid = await verifyPassword(password, hiringManager.passwordHash);
  if (!valid) {
    throw Object.assign(new Error("invalid email or password"), { status: 401 });
  }

  const token = signToken(hiringManager);
  return { token, hiringManager: toPublicHiringManager(hiringManager) };
}

export function getHiringManagerFromAuthHeader(authHeader) {
  if (!authHeader?.startsWith("Bearer ")) {
    throw Object.assign(new Error("missing or invalid authorization header"), { status: 401 });
  }
  const token = authHeader.slice("Bearer ".length).trim();
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw Object.assign(new Error("invalid or expired token"), { status: 401 });
  }

  const hiringManager = db.getHiringManager(payload.sub);
  if (!hiringManager) {
    throw Object.assign(new Error("account not found"), { status: 401 });
  }
  return toPublicHiringManager(hiringManager);
}
