import mongoose , {Schema} from "mongoose";

const meetingSchema = new Schema(
    {
        uesr_id: {type: String},
        meetingCode: {type: String, required: true},
        date: {typr: Date, default: Date.now, required: true}
    }
)

const Meeting = mongoose.model("Meeting", meetingSchema);

export {Meeting};