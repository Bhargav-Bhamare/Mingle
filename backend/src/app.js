import express from "express";
import {createServer} from "node:http";

import {Server} from "socket.io";
import mongoose from "mongoose";
import {connectToSocket} from "./controllers/socketManager.js";

import cors from "cors";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", (process.env.PORT || 8000));
app.use(cors());
app.use(express.json({limit: "40kb"}));
app.use(express.urlencoded({extended: true, limit: "40kb"}));

const start = async () => {
    const connectionDb = await mongoose.connect("mongodb+srv://bbhamare9e20_db_user:YZp4vJFH.B-EnJ-@cluster0.5pdwyfi.mongodb.net/");
    console.log(`MONGO Connected DB HOST : ${connectionDb.connection.host}`);
    server.listen(app.get("port"), () =>{
        console.log("Server is running on port 8000");
    })
}

start();