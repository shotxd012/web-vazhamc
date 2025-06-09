const express = require("express");
const session = require("express-session");
const passport = require("passport");
const connectDB = require("./config/database");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const messageRoutes = require("./routes/messages");
const pageGuideRoutes = require("./routes/guides");
const pageStaffRoutes = require("./routes/staff");
const pageRulesRoutes = require("./routes/rules");
const authShotRoutes = require("./routes/authShot");
const activityRoutes = require("./routes/activity");
const shotUsersRoutes = require("./routes/shotUsers");
const announcementRoutes = require("./routes/announcements");
const mongoStatsRoutes = require("./routes/mongoStats");
const { startBot } = require("./config/bot");
const homeRoute = require("./routes/home");
const msgDataRoutes = require("./routes/msgData");
const mediaRoutes = require("./routes/media");
const ticketRoutes = require('./routes/tickets');
const adminticket = require('./routes/shot/tickets');
const apiRoutes = require("./routes/api");
const adminTicketRoutes = require("./routes/admin/tickets");
const admin = require("./routes/admin/dash");
const legalRoutes = require("./routes/legal");
const statusRoutes = require("./routes/status");
const path = require('path');
const { loadEvents } = require('./events');

require("dotenv").config();
require("./config/passport");

const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// connect to database
connectDB();
startBot();

// Load Discord events
loadEvents();

// Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: null 
    }
}));

app.use(passport.initialize());
app.use(passport.session());


// Routes
app.use(authRoutes);
app.use(profileRoutes);
app.use(messageRoutes);
app.use(pageGuideRoutes);
app.use(pageStaffRoutes);
app.use(pageRulesRoutes);
app.use(authShotRoutes);
app.use(activityRoutes);
app.use(shotUsersRoutes);
app.use(mongoStatsRoutes);
app.use(announcementRoutes);
app.use("/", homeRoute);
app.use(msgDataRoutes);
app.use(mediaRoutes);
app.use(ticketRoutes);
app.use("/", apiRoutes);
app.use(adminticket);
app.use("/admin/tickets", adminTicketRoutes);
app.use("/admin", admin);
app.use("/admin/media", require("./routes/admin/media"));
app.use("/legal", legalRoutes);
app.use("/status", statusRoutes);

// Error handling routes
app.use((req, res, next) => {
    res.status(404).render('errors/404', {
        title: '404 - Page Not Found',
        user: req.user
    });
});

app.get('/500', (req, res) => {
    res.status(500).render('errors/500', {
        title: '500 - Server Error',
        user: req.user
    });
}); 

app.get('/403', (req, res) => {
    res.status(403).render('errors/403', {
        title: '403 - Forbidden',
        user: req.user
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err.status === 403) {
        return res.status(403).render('errors/403', {
            title: '403 - Forbidden',
            user: req.user
        });
    }
    res.status(500).render('errors/500', {
        title: '500 - Server Error',
        user: req.user
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

