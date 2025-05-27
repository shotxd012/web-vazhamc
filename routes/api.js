const express = require("express");
const router = express.Router();
const v1Routes = require("./api/v1");

// Mount v1 API routes with /api prefix
router.use("/api/v1", v1Routes);

module.exports = router;
