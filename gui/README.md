# Sign Language Translator GUI

A web-based interface for the sign language hand tracking system.

## Quick Start

### 1. Start the Backend Server

```bash
# From the project root directory
python server.py
```

This will start the Flask server at `http://localhost:5000`

### 2. Start the React Frontend

```bash
# In a new terminal
cd gui
npm run dev
```

This will start the React app at `http://localhost:5173`

### 3. Open the App

Navigate to `http://localhost:5173` in your browser.

## Features

- **Live Video Feed**: Real-time hand tracking with landmark visualization
- **Capture Button**: Click to save gesture data to `dataset.csv`
- **Buffer Progress**: Visual indicator showing when buffer is ready
- **Landmark Graph**: Real-time fingertip movement visualization
- **Quit Button**: Gracefully stop the hand tracker

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/video_feed` | GET | MJPEG video stream |
| `/capture` | POST | Save current gesture buffer |
| `/quit` | POST | Stop the hand tracker |
| `/status` | GET | Get buffer level and capture count |
| `/landmarks` | GET | Get current fingertip positions |
