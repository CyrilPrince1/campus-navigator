const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const path = require("path");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

const app = express();
dotenv.config();

//middlewares
app.use(express.static(__dirname));
app.use(cors());
app.use(express.json());

//env variables
const PORT = process.env.PORT || 3000;
const ORS_API_KEY = process.env.ORS_API_KEY;
const userEmail = process.env.EMAIL_USER;
const userPassword = process.env.EMAIL_PASSWORD;

//mode of travel
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

app.post("/api/geocode", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    const nominatimURL = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=1`;

    const response = await fetch(nominatimURL, {
      headers: {
        "User-Agent": "CampusNavigator/1.0 (aprincecyril@gmail.com)", //required
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Geocoding error:", error);
    res.status(500).json({ error: "Failed to geocode location" });
  }
});

//email rout
app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "Kindly fill all fields!" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: userEmail,
        pass: userPassword,
      },
    });

    const mailOptions = {
      from: `"Campus Navigator" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New Message: ${subject}`,
      html: `
  
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
  
  `,
    };

    await transporter.sendMail(mailOptions);
    res
      .status(200)
      .json({ success: true, message: "message sent successfully!" });
  } catch (error) {
    console.error("sending email Error:", error);
    res
      .status(500)
      .json({ success: "false", message: "failed to send message" });
  }
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
