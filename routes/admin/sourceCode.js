const express = require("express");
const router = express.Router();
const SourceCode = require("../../models/SourceCode");
const isStaff = require("../../middleware/isStaff");

// GET /admin/source-code
router.get("/source-code", isStaff, async (req, res) => {
    try {
        const sourceCodes = await SourceCode.find().sort({ timestamp: -1 });
        res.render("admin/source-code", { user: req.user, sourceCodes });
    } catch (err) {
        console.error("Error loading source codes:", err);
        res.status(500).send("Server Error");
    }
});

// POST /admin/source-code
router.post("/source-code", isStaff, async (req, res) => {
    const { title, description, githubLink, youtubeThumbnail, price } = req.body;
    const isPaid = req.body.isPaid === "on";
    const { discordId, username, avatar } = req.user;

    try {
        const newSourceCode = new SourceCode({
            discordId,
            username,
            avatar,
            title,
            description,
            githubLink,
            youtubeThumbnail,
            isPaid,
            price
        });

        await newSourceCode.save();
        res.redirect("/admin/source-code");
    } catch (err) {
        console.error("Error creating source code:", err);
        res.status(500).send("Server Error");
    }
});

// POST /admin/source-code/:id/delete
router.post("/source-code/:id/delete", isStaff, async (req, res) => {
    try {
        await SourceCode.findByIdAndDelete(req.params.id);
        res.redirect("/admin/source-code");
    } catch (err) {
        console.error("Error deleting source code:", err);
        res.status(500).send("Server Error");
    }
});

module.exports = router;