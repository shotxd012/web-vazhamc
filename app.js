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
const path = require('path');



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

// Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
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
app.use(adminticket);
app.use(apiRoutes);
app.use("/admin/tickets", adminTicketRoutes);
app.use("/admin", require("./routes/admin/tickets"));

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

