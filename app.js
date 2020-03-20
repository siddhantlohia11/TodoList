//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const _ = require('lodash');
const app = express();
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/newDB', {useNewUrlParser: true, useUnifiedTopology: true});


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const defaultlist = [];
const workItems = [];

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



app.get("/", function(req, res) {
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
      res.redirect("/");
     } else {
      res.render("list", {listTitle: day, newListItems: list});
    }
  });
});

app.get('/:userid', function(req,res){
  var dynamic = _.capitalize(req.params.userid);
  DynamicList.findOne({name: dynamic}, function(err,foundList){
    if (!err){
      if (!foundList){
        const dynamiclist = new DynamicList({
          name: dynamic,
          items: defaultlist
        });
        dynamiclist.save();
        res.redirect("/" + dynamic);
      } else{
        res.render("list", {listTitle: dynamic, newListItems:foundList.items})
      }
    }
  });
});


app.post("/", function(req, res){
  const item = req.body.newItem;
  const listName = req.body.list;

  const nextItem = new List ({
    name: item
  });
  const day = date.getDate();

  if (listName === day){
    nextItem.save();
    res.redirect("/");
  } else {
    DynamicList.findOne({name:listName}, function(err,foundList){
      foundList.items.push(nextItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req,res){
  const day = date.getDate();
  var deleteItem = req.body.delete;
  var namee = req.body.namee;
  if (namee === day){
    List.findByIdAndRemove(deleteItem, function(err){
      if (!err){
        console.log("Succesfully deleted an item");
        res.redirect("/");
        }
    });
  } else {
    DynamicList.findOneAndUpdate({name: namee }, {$pull:{items:{_id: deleteItem}}}, function(err,findList){
      if (!err){
        res.redirect("/" + namee);
      }
    });
  }
});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
