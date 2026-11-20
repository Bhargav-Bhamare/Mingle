import { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {


    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");


    const {addToUserHistory} = useContext(AuthContext);
    let handleJoinVideoCall = async () => {
        await addToUserHistory(meetingCode)
        navigate(`/${meetingCode}`)
    }

    return (
        <>

            <div className="navBar">

                <div style={{ display: "flex", alignItems: "center" }}>
                    <h2>Mingle</h2>
                </div>

                <div className="navActions">
                    <div className="historyAction" onClick={() => navigate("/history")}>
                        <IconButton><RestoreIcon /></IconButton>
                        <p>History</p>
                    </div>
                    <Button variant="text" onClick={() => {
                        localStorage.removeItem("token")
                        navigate("/auth")
                    }} sx={{ color: "#53617e", fontWeight: 700 }}>
                        Logout
                    </Button>
                </div>
            </div>


            <div className="meetContainer">
                <div className="leftPanel">
                    <div>
                        <h2>Providing Quality Video Call Just Like Quality Education</h2>

                        <div className="joinRow">
                            <TextField
                                onChange={e => setMeetingCode(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") handleJoinVideoCall() }}
                                id="outlined-basic"
                                label="Meeting Code"
                                variant="outlined"
                            />
                            <Button
                                onClick={handleJoinVideoCall}
                                variant="contained"
                                disabled={!meetingCode.trim()}
                                sx={{ height: 48, px: 3, borderRadius: "12px", background: "#665cf6" }}
                            >
                                Join
                            </Button>
                        </div>
                    </div>
                </div>
                <div className='rightPanel'>
                    <img srcSet='/logo3.png' alt="" />
                </div>
            </div>
        </>
    )
}


export default withAuth(HomeComponent)