const express = require('express');
const router = express.Router();

// Orders route removed — orders are now created via the ticket system.
// Keep a minimal redirect so any old links continue to the ticket create form.
router.get('/order/create', (req, res) => {
  // Forward to the ticket creation page (preserve query string)
  const qs = req.originalUrl.split('?')[1];
  res.redirect(qs ? `/profile/tickets/create?${qs}` : '/profile/tickets/create');
});

module.exports = router;
