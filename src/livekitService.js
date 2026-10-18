import { getAuth } from "firebase/auth";
import { auth } from "./firebase.js";

export async function getLiveKitToken(matchId) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("You must be logged in to start a call.");
  }

  // Firebase provides a signed token proving who the user is.
  const firebaseToken = await user.getIdToken();

  const response = await fetch(
    "http://localhost:3001/api/livekit/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${firebaseToken}`,
      },
      body: JSON.stringify({ matchId }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Could not join call.");
  }

  return data;
}
