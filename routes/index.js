const UserController = require('../controller/UserController.js')
const ProjectController = require('../controller/ProjectController.js')
const express = require('express');
const router = express.Router();
const fileUpload = require('express-fileupload');



router.get('/', UserController.home);
router.get('/login', UserController.loginPage)
router.post('/login', UserController.login)
router.post('/signup',UserController.signup)
router.get('/dashboard', UserController.sessionChecker, UserController.dashboard);
router.get('/logout',UserController.logout)

router.get('/project', UserController.sessionChecker, UserController.project);
router.post('/project', UserController.sessionChecker, UserController.updateProjectColumns);
router.get('/projectadd', UserController.sessionChecker,UserController.addProject)
router.post('/projectadd', UserController.sessionChecker,UserController.saveProject)

router.get('/projectdelete/:id', UserController.sessionChecker, UserController.deleteProject)
router.get('/profile', UserController.sessionChecker, UserController.profile);
router.post('/profile',UserController.sessionChecker, UserController.updateProfile)
router.post('/updateproject',UserController.sessionChecker,UserController.updateProject)
router.get('/updateproject/:id',UserController.sessionChecker,UserController.getProjectData)

router.get('/project/:id/overview',UserController.sessionChecker,ProjectController.projectDetails)
router.get('/project/:id/members',UserController.sessionChecker,ProjectController.listMembers)
router.post('/project/:id/members',UserController.sessionChecker,ProjectController.updateMemberColumns)
router.get('/project/:id/members/memberadd',UserController.sessionChecker,ProjectController.getMemberData)
router.post('/project/:id/members/memberadd',UserController.sessionChecker,ProjectController.updateMembers)
router.get('/project/:userid/members/:id',UserController.sessionChecker,ProjectController.deleteMembers)

router.get('/project/:id/issues',UserController.sessionChecker,ProjectController.listIssues)
router.post('/project/:id/issues',UserController.sessionChecker,ProjectController.updateIssueColumns)
router.get('/project/:id/issue/add',UserController.sessionChecker,ProjectController.getIssues)
router.post('/project/:id/issue/add',UserController.sessionChecker,ProjectController.addIssues)

router.get('/project/:id/issue/update/:issueid',UserController.sessionChecker,ProjectController.getIssueData)
router.post('/project/:id/issue/update/:issueid',UserController.sessionChecker,ProjectController.updateIssue)
router.get('/project/:id/issue/:issueid',UserController.sessionChecker,ProjectController.deleteIssues)

router.get('/project/:id/activity',UserController.sessionChecker,ProjectController.listActivity)
router.get('/project/:id/issue/upload/:issueid',UserController.sessionChecker,ProjectController.getUploadPage)
router.post('/project/:id/issue/upload/:issueid',UserController.sessionChecker,ProjectController.uploadFile)
router.get('/project/:id/issue/upload/:issueid/:filenames',UserController.sessionChecker,ProjectController.uploadFile)

router.get('/makeadmin',UserController.sessionChecker,ProjectController.getUpdateUserPrivilegePage)
router.post('/makeadmin',UserController.sessionChecker,ProjectController.updateUserPrivilege)

router.get('/listmembers',UserController.sessionChecker,UserController.listUserPages)
router.get('/updatemember/:id',UserController.sessionChecker,UserController.getUpdateMemberPages)
router.post('/updatemember/:id',UserController.sessionChecker,UserController.updateUser)
router.get('/deletemember/:id',UserController.sessionChecker,UserController.deleteUser)

module.exports = router;
