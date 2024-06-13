// routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/login', authController.login_get);
router.post('/login', authController.login_post);
router.get('/signup', authController.signup_get);
router.post('/signup', authController.signup_post);
router.get('/logout', authController.logout_get);
router.get('/profile', requireAuth, authController.profile_get); // Route to display user profile
router.post('/top-up', requireAuth, authController.topUp_post); // Route to handle top-up balance

module.exports = router;