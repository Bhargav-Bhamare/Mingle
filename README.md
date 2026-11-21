# Mingle

**Mingle** is a real-time video conferencing web application for creating or joining meeting rooms, communicating by video and audio, sharing screens, and exchanging chat messages. Its tagline is **“Connect. Converse. Collaborate.”**

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Repository structure](#repository-structure)
- [Data models](#data-models)
- [Frontend routes](#frontend-routes)
- [REST API](#rest-api)
- [Socket.IO events](#socketio-events)
- [Environment configuration](#environment-configuration)
- [Local setup](#local-setup)
- [Build and deployment](#build-and-deployment)
- [Usage guide](#usage-guide)
- [Security and reliability notes](#security-and-reliability-notes)
- [Known limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Future improvements](#future-improvements)

## Overview

Mingle is split into a React frontend and an Express backend:

- The **frontend** provides the landing page, authentication UI, meeting-code entry, meeting history, lobby, video call, screen sharing, and chat.
- The **backend** provides REST authentication/history endpoints and a Socket.IO server for room coordination and WebRTC signaling.
- **MongoDB** stores users and joined-meeting history.
- **WebRTC** establishes browser-to-browser media streams for participants.

A meeting room is identified by a URL path, such as `/<meeting-code>`. It is not created as a separate database record.

## Features

### Account and navigation

- Full-name, username, and password registration
- Username/password login
- Session token stored in browser `localStorage`
- Client-side protection for Home and History pages
- Logout through local-token removal

### Meetings

- Join through a meeting code or direct URL
- Guest access through direct meeting URLs
- Camera and microphone preview in a lobby
- Responsive remote participant grid
- Separate local video tile
- Camera, microphone, and screen-sharing controls
- End-call navigation back to Home

### Chat

- Real-time in-call messaging
- Sender name and message display
- Unread-message badge
- Recent room messages replayed to newly joining sockets
- Chat is currently not persisted to MongoDB

### Meeting history

- Authenticated users can save meeting codes
- History is ordered by newest first
- Records display a meeting code and date
- Unauthenticated history requests redirect to login

## Architecture

```text
React Browser Application
        |
        | HTTP through Axios
        | /register, /login, /add_to_activity,
        | /get_all_activities
        v
Express REST API
        |
        +---- Mongoose ----> MongoDB
        |
        +---- Socket.IO ----> Room membership
                               |
                               +--> Chat
                               +--> WebRTC signaling
                                      |
                                      v
                              Browser-to-browser
                              WebRTC media streams
```

### Call lifecycle

1. The user enters a meeting code or opens a meeting URL.
2. The browser requests camera and microphone permissions.
3. The user enters a display name and joins the lobby.
4. The frontend connects to Socket.IO and emits `join-call`.
5. The backend adds the socket ID to the room and broadcasts `user-joined`.
6. The frontend creates an `RTCPeerConnection` for every remote peer.
7. SDP and ICE data are exchanged through the `signal` event.
8. Remote video and audio tracks appear in participant tiles.
9. Chat messages are stored temporarily in the in-memory room message map.
10. Leaving closes peer connections, stops local media tracks, disconnects the socket, and navigates to Home.

## Technology stack

### Frontend

| Area | Technology |
|---|---|
| UI framework | React 19 |
| Build tool | Vite 8 |
| Routing | React Router 7 |
| Components | Material UI 9 |
| HTTP client | Axios |
| Real-time client | Socket.IO Client 4 |
| Media | Browser WebRTC, MediaDevices, and display-capture APIs |
| Styling | CSS and CSS Modules |

### Backend

| Area | Technology |
|---|---|
| Runtime | Node.js |
| HTTP framework | Express 5 |
| Database | MongoDB |
| ODM | Mongoose 9 |
| Real-time server | Socket.IO 4 |
| Password hashing | bcrypt |
| Configuration | dotenv |
| CORS | cors |

## Repository structure

```text
Mingle/
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── controllers/
│   │   │   ├── user.controller.js
│   │   │   └── socketManager.js
│   │   ├── models/
│   │   │   ├── user.model.js
│   │   │   └── meeting.model.js
│   │   └── routes/
│   │       └── user.routes.js
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── environment.js
│   │   ├── contexts/AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── landing.jsx
│   │   │   ├── authentication.jsx
│   │   │   ├── home.jsx
│   │   │   ├── history.jsx
│   │   │   └── videoMeet.jsx
│   │   ├── utils/withAuth.jsx
│   │   └── styles/videoComponent.module.css
│   ├── public/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Data models

### User

Defined in `backend/src/models/user.model.js`.

| Field | Type | Rules |
|---|---|---|
| `username` | String | Required and unique |
| `password` | String | Required; bcrypt hash |
| `token` | String | Random session token |

The registration request accepts `name`, but the current user schema does not define or store a name field.

### Meeting

Defined in `backend/src/models/meeting.model.js`.

| Field | Type | Rules |
|---|---|---|
| `user_id` | String | Required; stores the user's username |
| `meetingCode` | String | Required; stores the meeting code |
| `date` | Date | Defaults to the current time |

Meeting history uses a username string rather than a MongoDB reference from the meeting document to the user document.

## Frontend routes

| Path | Page | Access |
|---|---|---|
| `/` | Landing page | Public |
| `/auth` | Sign in or sign up | Public |
| `/home` | Meeting-code entry | Token required by the client guard |
| `/history` | Meeting history | Token required by page logic |
| `/:url` | Lobby and meeting room | Public/direct guest access |

## REST API

The API is mounted at `/api/v1/users`.

### Register

```http
POST /api/v1/users/register
Content-Type: application/json

{
  "name": "Bhargav",
  "username": "bhargav",
  "password": "password123"
}
```

Success: `201 Created`

```json
{
  "message": "User Registered!",
  "token": "random-hex-token"
}
```

### Login

```http
POST /api/v1/users/login
Content-Type: application/json

{
  "username": "bhargav",
  "password": "password123"
}
```

Success: `200 OK`

```json
{
  "token": "random-hex-token"
}
```

Logging in replaces the token stored in the user document.

### Add meeting to history

```http
POST /api/v1/users/add_to_activity
Content-Type: application/json

{
  "token": "random-hex-token",
  "meeting_code": "team-sync"
}
```

Success: `201 Created`

```json
{
  "message": "Added code to history"
}
```

### Get meeting history

```http
GET /api/v1/users/get_all_activities?token=random-hex-token
```

Success: `200 OK`, ordered newest first.

```json
[
  {
    "_id": "mongodb-object-id",
    "user_id": "bhargav",
    "meetingCode": "team-sync",
    "date": "2026-11-21T09:22:06.000Z"
  }
]
```

### Error status behavior

| Status | Meaning |
|---|---|
| `400` | Missing login fields or missing meeting code |
| `401` | Invalid credentials or invalid/missing token |
| `404` | Username not found |
| `302` | Existing username during registration |
| `500` | Database or server operation failure |

## Socket.IO events

Room membership and chat data are held in process memory:

- `connections`: meeting URL to an array of socket IDs
- `messages`: meeting URL to chat-message arrays
- `timeOnline`: socket ID to connection start time

This state is lost when the backend restarts and is not shared between backend processes.

| Event | Direction | Purpose |
|---|---|---|
| `join-call` | Client → server | Add a socket to a room |
| `user-joined` | Server → room | Inform peers and provide the current socket-ID list |
| `signal` | Peer → server → peer | Relay SDP and ICE signaling data |
| `chat-message` | Client → server → room | Broadcast chat text |
| `user-left` | Server → room | Notify participants that a peer left |
| `disconnect` | Client → server | Remove the socket from rooms |

The backend identifies the room for chat by finding the first room whose socket list contains the sender's socket ID.

## Environment configuration

Create `backend/.env`:

```dotenv
PORT=8000
MONGO_URI=mongodb://127.0.0.1:27017/mingle
```

The backend also checks `DB_URI` if `MONGO_URI` is absent.

The frontend base URL is selected in `frontend/src/environment.js`:

- Development: `http://localhost:8000`
- Production: `https://minglebackend-yeav.onrender.com`

For deployed meetings, HTTPS is strongly recommended because browsers restrict camera, microphone, and display-capture access in insecure contexts.

## Local setup

### Prerequisites

- Node.js and npm
- MongoDB locally or MongoDB Atlas
- A modern browser with WebRTC support
- Camera and microphone access for call testing

### Install

```bash
git clone https://github.com/Bhargav-Bhamare/Mingle.git
cd Mingle
npm --prefix backend install
npm --prefix frontend install
```

### Configure MongoDB

Create `backend/.env`:

```dotenv
PORT=8000
MONGO_URI=mongodb://127.0.0.1:27017/mingle
```

Do not commit credentials or `.env` files.

### Start backend

```bash
npm --prefix backend run dev
```

The API and Socket.IO server normally listen on `http://localhost:8000`.

### Start frontend

```bash
npm --prefix frontend run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

### Test a call

1. Open Mingle in two browser windows or devices.
2. Register or sign in.
3. Enter the same meeting code in both clients.
4. Allow browser camera and microphone access.
5. Enter a display name in each lobby.
6. Verify video, audio, chat, and screen sharing.

## Build and deployment

### Frontend build

```bash
npm --prefix frontend run build
```

Vite writes the production site to `frontend/build/`.

Deploy that directory to a static host and configure SPA fallback rewrites for routes such as `/home`, `/history`, and `/:meetingCode`.

### Frontend preview

```bash
npm --prefix frontend run preview
```

### Backend start

```bash
npm --prefix backend start
```

On a Node-compatible host, configure `PORT` and `MONGO_URI` or `DB_URI`. Add an explicit frontend origin allowlist in production instead of using permissive CORS.

If the backend deployment URL changes, update `frontend/src/environment.js` and rebuild the frontend.

### Available scripts

| Application | Command | Purpose |
|---|---|---|
| Backend | `npm --prefix backend run dev` | Start with nodemon |
| Backend | `npm --prefix backend start` | Start with Node |
| Backend | `npm --prefix backend run prod` | PM2 entry script |
| Frontend | `npm --prefix frontend run dev` | Start Vite development server |
| Frontend | `npm --prefix frontend run build` | Create production build |
| Frontend | `npm --prefix frontend run lint` | Run ESLint |
| Frontend | `npm --prefix frontend run preview` | Preview the production build |

## Usage guide

### Join as a guest

1. Open the landing page.
2. Select **Join as Guest** or open `/<meeting-code>` directly.
3. Allow media permissions.
4. Enter a display name and join.

### Join as an authenticated user

1. Register or sign in.
2. Enter a meeting code on Home.
3. Select **Join**.
4. Enter a display name in the lobby.

### Call controls

- **Camera:** enable or disable the local camera
- **Microphone:** enable or disable the local microphone
- **Screen:** start or stop display capture
- **Chat:** open or close the in-call chat panel
- **Red phone:** end the call and return Home

## Security and reliability notes

- Passwords are stored as bcrypt hashes.
- Login and registration issue random hexadecimal bearer-like tokens.
- History endpoints verify a token before accessing meeting records.
- Tokens are stored in browser `localStorage`.
- The backend does not use JWT, token expiration, or authentication middleware.
- CORS is currently permissive.
- Socket rooms are not authenticated by a user token.
- Meeting codes provide no invitation or access-control guarantees.
- WebRTC signaling is sent through Socket.IO.
- No TURN server is configured.
- Room membership and chat data exist only in backend memory.
- STUN may not work across restrictive NAT or enterprise firewall configurations.

## Known limitations

- No automated test suite is included.
- No server-side schema-validation library is used.
- Registration does not persist the submitted `name`.
- Existing usernames return HTTP 302 instead of HTTP 409.
- Room and chat data do not survive backend restarts.
- Chat messages are not stored in MongoDB.
- Socket.IO state cannot be shared across multiple backend processes.
- Guests can join arbitrary meeting URLs.
- No password-protected rooms or waiting room is implemented.
- Only a public STUN server is configured, with no TURN fallback.
- `localStorage` is susceptible to token theft if client-side scripts are compromised.
- The frontend does not have global unauthorized-response handling.
- The backend has no graceful shutdown or in-memory-room cleanup strategy.

## Troubleshooting

### Camera or microphone is unavailable

- Grant browser permission for the Mingle origin.
- Use `localhost` or deploy over HTTPS.
- Verify that another application is not exclusively using the device.
- Inspect browser console errors.

### Frontend cannot reach the backend

- Confirm that the backend is running on port 8000.
- Confirm `frontend/src/environment.js` points to the backend.
- Check CORS and network errors in browser developer tools.
- Verify that MongoDB is connected.

### MongoDB connection fails

- Confirm `MONGO_URI` or `DB_URI` exists in `backend/.env`.
- Confirm local MongoDB is running.
- Verify Atlas credentials and network allowlists.

### Peers cannot see or hear each other

- Confirm the exact same meeting code is used.
- Test without a VPN or restrictive enterprise firewall.
- Inspect ICE/SDP errors in the browser console.
- Add a TURN server for restrictive networks.

### Backend port is already in use

Set another port in `backend/.env`:

```dotenv
PORT=8080
```

Then update the frontend backend URL accordingly.

## Future improvements

- Add persistent chat and join/leave history.
- Add room passwords, waiting rooms, and host controls.
- Add JWT or server-side sessions with expiration and logout invalidation.
- Add centralized authentication middleware and request validation.
- Add Redis or another Socket.IO adapter for horizontal scaling.
- Add TURN support and media connection diagnostics.
- Add automated frontend and backend tests.
- Add a full name field to the user model.
- Replace wildcard CORS with an origin allowlist.
- Add CI/CD linting, testing, build, and deployment workflows.
