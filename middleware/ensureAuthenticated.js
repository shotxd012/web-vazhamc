module.exports = {
    isAuthenticated: function(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        // Store the current URL to redirect back after authentication
        const returnTo = req.originalUrl;
        res.redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
};