const express = require('express');
const { getUserDetails } = require('../utils/discordBot');
const router = express.Router();

router.get('/profile', async (req, res) => {
    if (!req.user) return res.redirect('/login');

    const userDetails = await getUserDetails(req.user.discordId);

    if (!userDetails) {
        return res.status(500).send("Error fetching user details.");
    }

    res.render('profile', {
        user: req.user,
        discordDetails: userDetails
    });
});

module.exports = router;
