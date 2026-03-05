import path from "node:path";
import dotenv from "dotenv";

const envPath = path.resolve(__dirname, "..", ".env.development");
dotenv.config({ path: envPath });
