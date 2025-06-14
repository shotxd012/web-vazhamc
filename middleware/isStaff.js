const { allowedRoles } = require('../config/roles.json');

module.exports = function isStaff(req, res, next) {
    if (!req.isAuthenticated || !req.isAuthenticated()) return res.redirect("/login");
    if (!allowedRoles.includes(req.user.role)) return res.redirect("/403");
    next();
};
