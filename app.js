//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");

const app = express();
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/newDB', {useNewUrlParser: true, useUnifiedTopology: true});


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const items = [];
const workItems = [];

const listSchema = new mongoose.Schema ({
  name: {
    type: String,
    required: [true,"Please check you data entry, no name specified!"]
  }
});

const List = mongoose.model('List', listSchema);
const Worklist = mongoose.model('Worklist', listSchema);


const item1 = new List ({
      name: "Buy Food"
    });
const item2 = new List ({
      name: "Cook Food"
    });
const item3 = new List ({
      name: "Eat Food"
    });
const item4 = new Worklist ({
  name: "Complete all"
});
const item5 = new Worklist ({
  name: "Pending works"
});
items.push(item1,item2,item3);






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



app.post("/", function(req, res){
  const item = req.body.newItem;

    // console.log(req.body.list)
  if (req.body.list === "Work"){
    // console.log("ho rahha");
      const nextItem = new Worklist ({
          name: item
        });
      nextItem.save();
      // workItems.push(item);
      res.redirect("/work");
    } else {


      const nextItem = new List ({
            name: item
          });
      nextItem.save();
      // items.push(item);
      res.redirect("/");
    }

  });

app.post("/delete", function(req,res){
  var deleteItem = req.body.delete;
    List.deleteOne({ _id: deleteItem }, function(err){
    if (err){
      console.log(err);
    } else{
      console.log("Succesfully deleted an item");
    }
  });
  Worklist.deleteOne({ _id: deleteItem }, function(err){
    if (err){
      console.log(err);
      } else{
      console.log("Succesfully deleted an item");
      }
  });
  res.redirect("/");
});

app.get("/work", function(req,res){

    Worklist.find({},  function(err,list2){
      if (list2.length === 0){
        Worklist.insertMany([item4,item5], function(err){
            if (err){
              console.log(err);
            } else{
            console.log("Succesfully added all the fruits");
            }
        });
        res.redirect("/work");
       } else {
        res.render("list", {listTitle: "Work", newListItems: list2});
      }
    });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
