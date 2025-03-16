const express = require('express');
routes = express.Router();

routes.get('/rules', (req, res) => {
    res.render('rules' , { user: req.user });
});

module.exports = routes;