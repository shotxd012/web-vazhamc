const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('api-docs', {
        user: req.user,
        title: 'API Documentation',
    });
});

module.exports = router;
