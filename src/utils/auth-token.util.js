import { createHash, randomUUID } from "node:crypto";

export const hashAuthToken = (token) =>
  createHash("sha256").update(token).digest("hex");

export const generateTokenJti = () => randomUUID();
