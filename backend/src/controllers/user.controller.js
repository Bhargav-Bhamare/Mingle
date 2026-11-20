import httpStatus from "http-status";
import {User} from "../models/user.model.js";
import bcrypt, {hash} from "bcrypt";
import {Meeting} from "../models/meeting.model.js";
import crypto from "crypto";

//Async handler
const login = async (req,res) =>{
    const {username, password} = req.body;

    if(!username || !password){
        return res.status(400).json({message: "Please Provide"})
    }
    try{
        const user = await User.findOne({username});
        if(!user){
            return res.status(httpStatus.NOT_FOUND).json({message: "User not Found!"})
        }

        let isPassWordValid = await bcrypt.compare(password,user.password)
        if(isPassWordValid){
            let token = crypto.randomBytes(20).toString("hex")
            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({token : token});
        }else{
            return res.status(httpStatus.UNAUTHORIZED).json({message: "Invalid Credentials!"})
        }

    }catch(e){
        return res.status(500).json({message: `Something Went wrong ${e}`})
    }
}





const register = async (req,res) =>{
    const {name, username, password} = req.body;

    try{
        const existingUser = await User.findOne({username});
        if(existingUser){
            return res.status(httpStatus.FOUND).json({message: "User Already Exists!"})
        }

        const hashedPassword = await bcrypt.hash(password,10);

        const newUser = new User({
            name: name,
            username: username,
            password: hashedPassword,
        });

        await newUser.save();

        res.status(httpStatus.CREATED).json({message: "User Registered!" })
    }catch (e){
        res.json({message: `Something went wrong ${e}`})

    }
}

const getUserHistory = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(httpStatus.UNAUTHORIZED).json({ message: "Authentication required" });
    }

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid or expired session" });
        }

        const meetings = await Meeting.find({ user_id: user.username }).sort({ date: -1 })
        return res.json(meetings)
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Unable to load meeting history" })
    }
}


const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;

    if (!token) {
        return res.status(httpStatus.UNAUTHORIZED).json({ message: "Authentication required" });
    }
    if (!meeting_code?.trim()) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Meeting code is required" });
    }

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid or expired session" });
        }

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code.trim()
        })

        await newMeeting.save();

        res.status(httpStatus.CREATED).json({ message: "Added code to history" })
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Unable to add meeting history" })
    }
}

export {login , register, getUserHistory, addToHistory};