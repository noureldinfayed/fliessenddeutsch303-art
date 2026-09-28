import { createHash } from "node:crypto";

export function hashLocalPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}
