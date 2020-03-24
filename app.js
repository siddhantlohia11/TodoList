//jshint esversion:6
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const _ = require('lodash');
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require("mongoose-findorcreate");


// mongoose.connect('mongodb+srv://admin-Siddhant:qwerty123@cluster0-33zzh.mongodb.net/newDB', {useNewUrlParser: true, useUnifiedTopology: true});


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: "Our Little Secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

const defaultlist = [];
const workItems = [];

mongoose.connect('mongodb+srv://admin-Siddhant:qwerty123@cluster0-33zzh.mongodb.net/newDB', {useNewUrlParser: true, useUnifiedTopology: true});
// mongoose.connect("mongodb://localhost:27017/newDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  facebookId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

const listSchema = new mongoose.Schema ({
  name: {
    type: String,
    required: [true,"Please check you data entry, no name specified!"]
  }
});


const dynamicSchema = new mongoose.Schema ({
  name: {
    type: String,
    required: [true,"Please check you data entry, no name specified!"]
  },
  items: [listSchema]
});

const List = mongoose.model('List', listSchema);
const DynamicList = mongoose.model('DynamicList', dynamicSchema);


const item1 = new List ({
      name: "Buy Food"
    });
const item2 = new List ({
      name: "Cook Food"
    });
const item3 = new List ({
      name: "Eat Food"
    });

defaultlist.push(item1,item2,item3);

passport.use(new FacebookStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://limitless-springs-32054.herokuapp.com/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

app.get("/", function(req,res){
  res.render("home");
});

app.get("/login", function(req,res){
  res.render("login");
});

app.get("/register", function(req,res){
  res.render("register");
});

app.get("/secrets", function(req,res){
  if (req.isAuthenticated()){
    res.render("secrets");
  } else{
    res.redirect("/login");
  }
});

app.get("/logout", function(req,res){
  req.logout();
  res.redirect("/");
});

app.get("/todo", function(req, res) {
  const day = date.getDate();

  List.find({},  function(err,list){
    if (list.length === 0){
      List.insertMany([item1,item2,item3], function(err){
          if (err){
            console.log(err);
          } else{
          console.log("Succesfully added all the fruits");
          }
      });
      res.redirect("/todo");
     } else {
      res.render("list", {listTitle: day, newListItems: list});
    }
  });
});

app.get('/todo/:userid', function(req,res){
  var dynamic = _.capitalize(req.params.userid);
  DynamicList.findOne({name: dynamic}, function(err,foundList){
    if (!err){
      if (!foundList){
        const dynamiclist = new DynamicList({
          name: dynamic,
          items: defaultlist
        });
        dynamiclist.save();
        res.redirect("/todo/" + dynamic);
      } else{
        res.render("list", {listTitle: dynamic, newListItems:foundList.items})
      }
    }
  });
});


app.post("/register", function(req,res){
  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if (err){
      console.log(err);
      res.redirect("/register");
    } else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", function(req,res){
  const user = new User ({
    username: req.body.username,
    password: req.body.passowrd
  });

  req.login(user, function (err){
    if(err){
      console.log(err);
    } else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
});


app.post("/todo", function(req, res){
  const item = req.body.newItem;
  const listName = req.body.list;

  const nextItem = new List ({
    name: item
  });
  const day = date.getDate();

  if (listName === day){
    nextItem.save();
    res.redirect("/todo");
  } else {
    DynamicList.findOne({name:listName}, function(err,foundList){
      foundList.items.push(nextItem);
      foundList.save();
      res.redirect("/todo/" + listName);
    });
  }
});

app.post("/todo/delete", function(req,res){
  const day = date.getDate();
  var deleteItem = req.body.delete;
  var namee = req.body.namee;
  if (namee === day){
    List.findByIdAndRemove(deleteItem, function(err){
      if (!err){
        console.log("Succesfully deleted an item");
        res.redirect("/todo");
        }
    });
  } else {
    DynamicList.findOneAndUpdate({name: namee }, {$pull:{items:{_id: deleteItem}}}, function(err,findList){
      if (!err){
        res.redirect("/todo/" + namee);
      }
    });
  }
});


app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000");
});
