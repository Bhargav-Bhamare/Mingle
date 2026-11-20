import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';

import { IconButton } from '@mui/material';

export default function History() {


    const { getHistoryOfUser } = useContext(AuthContext);

    const [meetings, setMeetings] = useState([])
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(true)


    const routeTo = useNavigate();

    useEffect(() => {
        if (!localStorage.getItem("token")) {
            routeTo("/auth");
            return;
        }

        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(Array.isArray(history) ? history : []);
                setError("");
            } catch (err) {
                setMeetings([]);
                setError(err?.response?.data?.message || "Unable to load meeting history.");
            } finally {
                setLoading(false);
            }
        }

        fetchHistory();
    }, [getHistoryOfUser, routeTo])

    let formatDate = (dateString) => {

        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return "Unknown date";
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const year = date.getFullYear();

        return `${day}/${month}/${year}`

    }

    return (
        <div className="historyPage">
            <header className="historyHeader">
                <IconButton onClick={() => routeTo("/home")} aria-label="Back to home">
                    <HomeIcon />
                </IconButton>
                <h1>Meeting history</h1>
            </header>

            <main className="historyContent">
                <h2>Recent meetings</h2>
                {loading ? <Typography>Loading meeting history...</Typography> : null}
                {error ? <Typography color="error">{error}</Typography> : null}
                {meetings.length !== 0 ? (
                    <div className="historyGrid">
                        {meetings.map((meeting) => (
                            <Card key={meeting._id} className="historyCard" variant="outlined">
                                <CardContent>
                                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#665cf6" }} gutterBottom>
                                        {meeting.meetingCode}
                                    </Typography>
                                    <Typography sx={{ color: "#778198" }}>
                                        {formatDate(meeting.date)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : !loading && !error ? (
                    <Typography sx={{ color: "#778198" }}>No meeting history yet</Typography>
                ) : null}
            </main>
        </div>
    )
}