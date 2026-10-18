
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { AccessToken } = require("livekit-server-sdk");

const app = express();

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Skill Roulette LiveKit server running"
  });
});

app.listen(process.env.PORT || 8000, () => {
  console.log("LiveKit token server running");
});
