import dotenv from "dotenv";

dotenv.config({path: ".env.test", override: true});

if (!process.env.DATABASE_URL?.includes("test")) {
    throw new Error("Not a test environment");
}