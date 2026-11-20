import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import io from "socket.io-client";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import server from '../environment';

const server_url = server;

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();
    const navigate = useNavigate();
    const connectionsRef = useRef({});

    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState([]);

    let [audio, setAudio] = useState();

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(true);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([])

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(3);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    let [videos, setVideos] = useState([])

    useEffect(() => {
        return () => {
            socketRef.current?.disconnect();
            Object.values(connectionsRef.current).forEach(connection => connection.close());
            connectionsRef.current = {};

            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
                window.localStream = undefined;
            }
        };
    }, []);

    const syncPeerTracks = (connection, stream) => {
        stream.getTracks().forEach(track => {
            const sender = connection.getSenders().find(item => item.track?.kind === track.kind);
            if (sender) {
                sender.replaceTrack(track).catch(error => console.error("Unable to replace peer track", error));
            } else {
                connection.addTrack(track, stream);
            }
        });
    };

    // TODO
    // if(isChrome() === false) {


    // }

    useEffect(() => {
        console.log("HELLO")
        getPermissions();
    }, [])

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e))
            }
        }
    }

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
                console.log('Video permission granted');
            } else {
                setVideoAvailable(false);
                console.log('Video permission denied');
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
                console.log('Audio permission granted');
            } else {
                setAudioAvailable(false);
                console.log('Audio permission denied');
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
            console.log("SET STATE HAS ", video, audio);

        }


    }, [video, audio])
    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();

    }




    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        Object.values(connectionsRef.current).forEach(connection => {
            syncPeerTracks(connection, window.localStream);
        });

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            Object.values(connectionsRef.current).forEach(connection => {
                syncPeerTracks(connection, window.localStream);
            });
        })
    }

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { }
        }
    }





    let getDislayMediaSuccess = (stream) => {
        console.log("HERE")
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        Object.values(connectionsRef.current).forEach(connection => {
            syncPeerTracks(connection, window.localStream);
        });

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            getUserMedia()

        })
    }

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            const connection = connectionsRef.current[fromId];
            if (!connection) {
                console.error(`Received a signal from unknown peer ${fromId}`);
                return;
            }

            if (signal.sdp) {
                connection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connection.createAnswer().then((description) => {
                            connection.setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connection.localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }




    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketIdRef.current = socketRef.current.id
            socketRef.current.emit('join-call', window.location.href)

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                connectionsRef.current[id]?.close();
                delete connectionsRef.current[id];
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => {
                const isNewUser = id === socketIdRef.current;
                const peerIds = isNewUser
                    ? clients.filter(peerId => peerId !== socketIdRef.current)
                    : [id];

                peerIds.forEach((peerId) => {
                    if (peerId === socketIdRef.current || connectionsRef.current[peerId]) return;

                    const connection = new RTCPeerConnection(peerConfigConnections);
                    connectionsRef.current[peerId] = connection;

                    connection.onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', peerId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    connection.ontrack = (event) => {
                        const stream = event.streams[0] ?? new MediaStream([event.track]);
                        setVideos(currentVideos => {
                            const hasPeer = currentVideos.some(video => video.socketId === peerId);
                            if (hasPeer) {
                                return currentVideos.map(video =>
                                    video.socketId === peerId ? { ...video, stream } : video
                                );
                            }
                            return [...currentVideos, {
                                socketId: peerId,
                                stream,
                                autoplay: true,
                                playsinline: true
                            }];
                        });
                    };

                    if (!window.localStream) {
                        window.localStream = new MediaStream([black(), silence()]);
                    }
                    syncPeerTracks(connection, window.localStream);

                    if (!isNewUser) {
                        connection.createOffer().then((description) => {
                            connection.setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', peerId, JSON.stringify({ 'sdp': connection.localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                });
            })
        })
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }
    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    let handleVideo = () => {
        setVideo(!video);
        // getUserMedia();
    }
    let handleAudio = () => {
        setAudio(!audio)
        // getUserMedia();
    }

    useEffect(() => {
        if (screen !== undefined) {
            getDislayMedia();
        }
    }, [screen])
    let handleScreen = () => {
        setScreen(!screen);
    }

    let handleEndCall = () => {
        Object.values(connectionsRef.current).forEach(connection => connection.close());
        connectionsRef.current = {};
        socketRef.current?.disconnect();

        if (window.localStream) {
            window.localStream.getTracks().forEach(track => track.stop());
            window.localStream = undefined;
        }

        navigate("/home", { replace: true });
    }

    let openChat = () => {
        setModal(true);
        setNewMessages(0);
    }
    let closeChat = () => {
        setModal(false);
    }
    let handleMessage = (e) => {
        setMessage(e.target.value);
    }

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };



    let sendMessage = () => {
        const text = message.trim();
        if (!text || !socketRef.current?.connected) return;

        socketRef.current.emit('chat-message', text, username)
        setMessage("");
    }

    
    let connect = () => {
        if (!username.trim()) return;
        setAskForUsername(false);
        getMedia();
    }


    return (
        <div>

            {askForUsername === true ?

                <div className={styles.lobby}>
                    <section className={styles.lobbyPanel}>
                        <h2>Enter the lobby</h2>
                        <p>Choose a display name and join the meeting.</p>
                        <div className={styles.lobbyControls}>
                            <TextField
                                id="outlined-basic"
                                label="Display name"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") connect() }}
                                variant="outlined"
                            />
                            <Button
                                variant="contained"
                                onClick={connect}
                                disabled={!username.trim()}
                                sx={{ px: 3, height: 56, borderRadius: "12px", background: "#665cf6" }}
                            >
                                Join meeting
                            </Button>
                        </div>
                    </section>
                    <div className={styles.lobbyPreview}>
                        <video ref={localVideoref} autoPlay muted playsInline></video>
                    </div>
                </div> :


                <div className={styles.meetVideoContainer}>

                    {showModal ? <div className={styles.chatRoom}>

                        <div className={styles.chatContainer}>
                            <h1>Chat</h1>

                            <div className={styles.chattingDisplay}>

                                {messages.length !== 0 ? messages.map((item, index) => {

                                    return (
                                        <div className={styles.chatMessage} key={index}>
                                            <strong>{item.sender}</strong>
                                            <p>{item.data}</p>
                                        </div>
                                    )
                                }) : <p className={styles.emptyChat}>No messages yet</p>}


                            </div>

                            <div className={styles.chattingArea}>
                                <TextField value={message} onChange={(e) => setMessage(e.target.value)} id="outlined-basic" label="Enter Your chat" variant="outlined" />
                                <Button variant='contained' onClick={sendMessage}>Send</Button>
                            </div>


                        </div>
                    </div> : <></>}


                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo} style={{ color: "white" }}>
                            {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                            <CallEndIcon  />
                        </IconButton>
                        <IconButton onClick={handleAudio} style={{ color: "white" }}>
                            {audio === true ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable === true ?
                            <IconButton onClick={handleScreen} style={{ color: "white" }}>
                                {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                            </IconButton> : <></>}

                        <Badge badgeContent={newMessages} max={999} color='orange'>
                            <IconButton onClick={() => setModal(!showModal)} style={{ color: "white" }}>
                                <ChatIcon />                        </IconButton>
                        </Badge>

                    </div>


                    <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted></video>

                    <div className={styles.conferenceView}>
                        {videos.map((video) => (
                            <div key={video.socketId}>
                                <video

                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                >
                                </video>
                            </div>

                        ))}

                    </div>

                </div>

            }

        </div>
    )
}