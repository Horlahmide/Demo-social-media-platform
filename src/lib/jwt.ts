import jwt from "jsonwebtoken";

export interface JwtUserPayload {
  id: string;
  iat: number;
  exp: number;
}

export const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: "7d" });
};

export const verifyToken = (token: string): JwtUserPayload | null => {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);

    if (typeof payload === "string") {
      return null;
    }

    if (
      typeof payload.id !== "string" ||
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    return payload as JwtUserPayload;
  } catch {
    return null;
  }
};
