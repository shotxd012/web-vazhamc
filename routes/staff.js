const express = require('express');
const router = express.Router();
const { getStaffDetails } = require('../utils/discordBot'); 

router.get('/staff', async (req, res) => {
    const staffs = await getStaffDetails(); 
    res.render('staff', { user: req.user, staffs });
});

module.exports = router;
