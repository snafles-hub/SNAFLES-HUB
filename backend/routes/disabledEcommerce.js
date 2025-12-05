const express = require('express');

const router = express.Router();

const message = { message: 'E-commerce features are disabled on this community showcase.' };

router.all('*', (_req, res) => {
  res.status(410).json(message);
});

module.exports = router;
