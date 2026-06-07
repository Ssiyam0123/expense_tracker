import dotenv from "dotenv";
import path from "path";

// Load environment variables in proper order
// 1. Load default .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
// 2. Load .env.local (overwrites .env)
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
// 3. Load .env.production if production (overwrites both)
if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: path.resolve(process.cwd(), ".env.production"), override: true });
}
