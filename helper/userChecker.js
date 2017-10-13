module.exports = function(req, res, next) {
//  console.log(req.session.user ,'=====', req.session.user.userid);
 if(req.session.user && req.session.user.userid) {
   return next();
 }
 res.redirect('/');
}
