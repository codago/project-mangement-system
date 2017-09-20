const UserController = require('../controller/UserController.js')
const ProjectController = require('../controller/ProjectController.js')
const express = require('express');
const router = express.Router();


router.get('/', UserController.home);
router.get('/login', UserController.loginPage)
router.post('/login', UserController.login)
router.get('/dashboard', UserController.sessionChecker, UserController.dashboard);
router.get('/logout',UserController.logout)

router.get('/project', UserController.sessionChecker, UserController.project);
router.get('/profile', UserController.sessionChecker, UserController.profile);
router.post('/profile',UserController.sessionChecker, UserController.updateProfile)


module.exports = router;
