const express = require("express");
const router = express.Router();
const client = require('../config/discordClient');

router.get("/developer", async (req, res) => {
    try {
        const developer = await client.users.fetch('871770826557517914');
        res.render("developer", { user: req.user, developer });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching developer data');
    }
});

module.exports = router;
