const express = require("express");
const session = require("express-session");
const passport = require("passport");
const connectDB = require("./config/database");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const messageRoutes = require("./routes/messages");
const pageGuideRoutes = require("./routes/guides");
const pageStaffRoutes = require("./routes/staff");

require("dotenv").config();
require("./config/passport");

const app = express();
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.static("public"));

// MongoDB Connection
connectDB();

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

app.get("/", (req, res) => {
    res.render("index", { user: req.user });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
