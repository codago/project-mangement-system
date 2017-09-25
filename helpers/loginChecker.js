'use strict'
module.exports = (req, res, next)=>{
 if(req.session.email){
  return next();
 }
 res.redirect('/');
}
