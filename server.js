const express = require("express");
const path = require("path")
const bodyParser = require("body-parser")
const morgan = require("morgan")
const session = require("express-session")
const cookieParser = require("cookie-parser");
const {Client} = require('pg')
const moment = require('moment');
const flash = require('connect-flash')

const app = express();
const router = express.Router();

const index = require('./routes/index.js')

app.set('port',3000)


app.set("views",path.join(__dirname,"views"))
app.set("view engine","ejs")

app.use(express.static(path.join(__dirname,"public")))

app.use(morgan('dev'))
app.use(flash())
app.use(
  bodyParser.urlencoded({
    extended:false
  })
)
app.use(cookieParser())

app.use(session({
  key:'user_sid',
  secret:'mysecret',
  resave:false,
  saveUninitialized: false,
  cookie:{
    expires : 600000
  }
}));

app.use((req,res,next)=>{
  console.log("execute");
  res.header('Cache-Control','private, no-cache, no-store, must-revalidate')
  res.header('Expires','-1')
  res.header('Pragma','no-cache')
  next();
})

app.use('/',index)


app.listen(app.get('port'),function(){
    console.log(`App started on port ${app.get('port')}`);
})
