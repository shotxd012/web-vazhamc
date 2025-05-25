const express = require('express');
const router = express.Router();

// Terms of Service route
router.get('/terms', (req, res) => {
    res.render('terms', {
        user: req.user || null,
        title: 'Terms of Service'
    });
});

// Privacy Policy route
router.get('/privacy', (req, res) => {
    res.render('privacy', {
        user: req.user || null,
        title: 'Privacy Policy'
    });
});

module.exports = router; 