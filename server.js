const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

const app = express();
dotenv.config();
const PORT = 3000;
const ORS_API_KEY = process.env.ORS_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const profileMap = {
  walking: "foot-walking",
  driving: "driving-car",
  cycling: "cycling-regular",
};

app.post("/api/route", async (req, res) => {
  try {
    const { coordinates, mode } = req.body;

    if (!coordinates || coordinates.length !== 2) {
      console.error("Missing or invalid coordinates");
      return res.status(400).json({ error: "Missing or invalid coordinates." });
    }

    const profile = profileMap[mode] || "foot-walking";

    const orsRes = await fetch(
      `https://api.openrouteservice.org/v2/directions/${profile}`,
      {
        method: "POST",
        headers: {
          Authorization: ORS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coordinates,
          instructions: true,
        }),
      }
    );

    const data = await orsRes.json();
    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    res.json(data);
  } catch (error) {
    console.error("ORS proxy error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//reverse geaolocation route
app.post("/api/reverse-geocode", async (req, res) => {
  const { lat, lng } = req.body;

  try {
    const url = `https://api.openrouteservice.org/geocode/reverse?api_key=${ORS_API_KEY}&point.lat=${lat}&point.lon=${lng}&size=1`;

    const orsResponse = await fetch(url);
    if (!orsResponse.ok) {
      throw new Error(`ORS Error: ${orsResponse.statusText}`);
    }

    const data = await orsResponse.json();
    res.json(data);
  } catch (err) {
    console.error("ORS proxy error:", err);
    res.status(500).json({ error: "Server failed to reverse geocode" });
  }
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
