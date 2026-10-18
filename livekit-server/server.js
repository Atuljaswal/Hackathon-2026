
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { AccessToken } = require("livekit-server-sdk");

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
}));

app.use(express.json());

const serviceAccount = require("./serviceAccountKey.json");

const firebaseApp = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(firebaseApp);

app.get("/", (req, res) => {
  res.json({ message: "LiveKit token server running" });
});

app.post("/api/livekit/token", async (req, res) => {
  try {
    // 1. Get the Firebase ID token from the request.
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Firebase authentication required",
      });
    }

    const firebaseToken = authorization.slice(7);

    // 2. Verify the token with Firebase Admin.
    const decodedToken = await getAuth(firebaseApp).verifyIdToken(
        firebaseToken,
        true
    );

    const uid = decodedToken.uid;

    // 3. Get the requested match ID.
    const { matchId } = req.body;

    if (
      typeof matchId !== "string" ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(matchId)
    ) {
      return res.status(400).json({
        error: "Invalid match ID",
      });
    }

    // 4. Read the actual match from Firestore.
    const matchRef = db
  .collection("matchRequests")
  .doc(matchId);

    const matchSnapshot = await matchRef.get();

    if (!matchSnapshot.exists) {
        return res.status(404).json({
        error: "Match not found"
    });
    };

    if (!matchSnapshot.exists) {
      return res.status(404).json({
        error: "Match not found",
      });
    }

    const match = matchSnapshot.data();

    // IMPORTANT:
    // These field names must match Developer 1's schema.
   const participants = [match.from, match.to];
   const acceptedBy = match.acceptedBy;

    // 5. Validate the match and its participants.
    if (
      !Array.isArray(participants) ||
      participants.length !== 2 ||
      new Set(participants).size !== 2 ||
      !participants.every(
        (participant) =>
          typeof participant === "string" &&
          participant.length > 0
      )
    ) {
      return res.status(403).json({
        error: "Invalid match participants",
      });
    }

    if (!participants.includes(uid)) {
      return res.status(403).json({
        error: "You are not part of this match",
      });
    }

    // 6. Both users must have accepted.
    if (
      !Array.isArray(acceptedBy) ||
      !participants.every((participant) =>
        acceptedBy.includes(participant)
      )
    ) {
      return res.status(403).json({
        error: "Both users must accept first",
      });
    }

    // 7. The match must still be active.
    if (match.status !== "accepted") {
      return res.status(403).json({
        error: "This match is not active",
      });
    }

    // 8. Both participants receive the SAME room name,
    // but each receives a token with their OWN Firebase UID.
    const roomName = `match-${matchId}`;

    const livekitToken = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: uid,
        ttl: "15m",
      }
    );

    livekitToken.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: false,
    });

    const token = await livekitToken.toJwt();

    return res.json({
      token,
      serverUrl: process.env.LIVEKIT_URL,
    });

  } catch (error) {
    console.error("Token request failed:", error);

    return res.status(401).json({
      error: "Unable to authorize call",
    });
  }
});

app.listen(process.env.PORT || 3001, () => {
  console.log("LiveKit token server running");
});
