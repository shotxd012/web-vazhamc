const express = require('express');
const router = express.Router();

router.get('/guides', (req, res) => {
    res.render('guides', { user: req.user });
});

module.exports = router;
