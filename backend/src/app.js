import express from "express";
import {createServer} from "node:http";
import dotenv from "dotenv";
import {fileURLToPath} from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({path: path.join(__dirname, "..", ".env")});

import {Server} from "socket.io";
import mongoose from "mongoose";
import {connectToSocket} from "./controllers/socketManager.js";

import cors from "cors";
import userRoutes from "./routes/user.routes.js";


const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", (process.env.PORT || 8000));
app.use(cors());
app.use(express.json({limit: "40kb"}));
app.use(express.urlencoded({extended: true, limit: "40kb"}));

app.use("/api/v1/users", userRoutes );



const start = async () => {
    const mongoUri = process.env.MONGO_URI || process.env.DB_URI;

    if (!mongoUri) {
        console.error("Missing MONGO_URI in backend/.env");
        return;
    }

    try {
        const connectionDb = await mongoose.connect(mongoUri);
        console.log(`MONGO Connected DB HOST : ${connectionDb.connection.host}`);
        server.on("error", (error) => {
            if (error.code === "EADDRINUSE") {
                console.error(`Port ${app.get("port")} is already in use. Stop the other server or set PORT in backend/.env.`);
                return;
            }
            console.error("Server error:", error.message);
        });

        server.listen(app.get("port"), () =>{
            console.log(`Server is running on port ${app.get("port")}`);
        })
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error.message);
    }
}

start();