const express = require("express");
const router = express.Router();
const axios = require("axios");

let serverStatus = {
    online: false,
    players: { online: 0, max: 0 }
};

// Function to fetch server status every 1 minute
async function fetchServerStatus() {
    try {
        const response = await axios.get("https://api.mcsrvstat.us/3/play.vazha.fun");
        serverStatus = {
            online: response.data.online,
            players: response.data.players || { online: 0, max: 0 }
        };
    } catch (error) {
        console.error("Error fetching Minecraft server status:", error);
        serverStatus = { online: false, players: { online: 0, max: 0 } };
    }
}

// Fetch server status every 1 minute
fetchServerStatus();
setInterval(fetchServerStatus, 60000);

router.get("/", (req, res) => {
    res.render("index", { user: req.user, serverStatus });
});

module.exports = router;
