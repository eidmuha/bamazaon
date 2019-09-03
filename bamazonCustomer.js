var mysql = require("mysql");
var fuzzy = require('fuzzy');
var _ = require('lodash');
var Table = require('cli-table');
var inquirer = require("inquirer");
inquirer.registerPrompt('suggest', require('inquirer-prompt-suggest'));
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

var products = [];

var connection = mysql.createConnection({
  host: "localhost",

  // Your port; if not 3306
  port: 3306,

  // Your username
  user: "root",

  // Your password
  password: "admin",
  database: "bamazon"
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("------ connected successfully -------")
  display()
});

function display(){
    console.log("       LIST OF PRODUCTS IN STOCK      \n");
    var query = connection.query("SELECT * FROM Products",  function(err, res) {
      if (err) throw err;
      // instantiate
        var table = new Table({
            head: ['ID', 'PRODUCT NAME', 'PRICE', 'AVAILABLE QUANTITY']
        
        });            

      res.forEach(function(element, index) {
          // table is an Array, so you can `push`, `unshift`, `splice` and friends
        table.push([index, element.product_name, element.price, element.stock_quantity]);
          products.push(element.product_name)
      });
      console.log(table.toString());
        runSearch();      
    });
}

function runSearch() {
    
  
    const questions = [
        {
            type: 'autocomplete',
            name: 'products',
            suggestOnly: true,
            message: 'Which product you want to buy(Choose ID)? ',
            source: searchProducts,
            pageSize: 4,
            validate: function(val) {
              return val ? true : 'Type something!';
            },
            default: "01",
        },
        {
            type: 'input',
            name: 'quantity',
            message: 'How many you want?: ',
            default: 01,
        },
        {
            type: 'list',
            name: 'cancel',
            message: 'Cancel?',
            choices: [
              'Yes',
              'No',
            ]
          }
      ];


    inquirer.prompt(questions).then(answers => {
        
        if (answers.cancel=='Yes') {
            askToExit(answers)
            // connection.end()
        }else{
            placeOrder()
        }
    });
}

function  placeOrder(){
    console.log("placing order ......")
}

function askToExit(){
    const questions = [
        {
            type: 'list',
            name: 'exit',
            message: 'Do you want to place ANOTHER order? ',
            choices: [
              'Yes',
              'No',
            ]
          }
      ];

    inquirer.prompt(questions).then(answers => {
        
        if (answers.exit=='Yes') {
            runSearch()
        }else{
            connection.end()
        }
    });

}

// autocomplete functions
function searchProducts(answers, input) {
    var temp = []
    for (let index = 0; index < products.length; index++) {
       temp[index] = index.toString();        
    }
    input = input || '';
    
    return new Promise(function(resolve) {
      setTimeout(function() {
        var fuzzyResult = fuzzy.filter(input, temp);
        resolve(
            fuzzyResult.map(function(el) {
                // console.log(el)
                return el.original +" "+ products[el.original.toString()] ;
          })
        );
      }, _.random(30, 500));
    });
  }

function artistSearch() {
  inquirer
    .prompt({
      name: "artist",
      type: "input",
      message: "What artist would you like to search for?"
    })
    .then(function(answer) {
      var query = "SELECT songs.year, songs.artist, songs.song, albums.album FROM songs LEFT JOIN albums ON songs.year = albums.year AND songs.artist = albums.artist WHERE songs.artist=?";
      connection.query(query, [answer.artist], function(err, res) {
        //   console.log(res)
        if (err) throw err;
        for (var i = 0; i < res.length; i++) {
          console.log("Song: " + res[i].song + " || Year: " + res[i].year +" || Album: " + res[i].album +" || Artis: "+ res[i].artist);
        }
        runSearch();
      });
    });
}

function multiSearch() {
  var query = "SELECT artist FROM top5000 GROUP BY artist HAVING count(*) > 1";
  connection.query(query, function(err, res) {
    if (err) throw err;
    for (var i = 0; i < res.length; i++) {
      console.log(res[i].artist);
    }
    runSearch();
  });
}

function rangeSearch() {
  inquirer
    .prompt([
      {
        name: "start",
        type: "input",
        message: "Enter starting position: ",
        validate: function(value) {
          if (isNaN(value) === false) {
            return true;
          }
          return false;
        }
      },
      {
        name: "end",
        type: "input",
        message: "Enter ending position: ",
        validate: function(value) {
          if (isNaN(value) === false) {
            return true;
          }
          return false;
        }
      }
    ])
    .then(function(answer) {
      var query = "SELECT position,song,artist,year FROM top5000 WHERE position BETWEEN ? AND ?";
      connection.query(query, [answer.start, answer.end], function(err, res) {
        if (err) throw err;
        for (var i = 0; i < res.length; i++) {
          console.log(
            "Position: " +
              res[i].position +
              " || Song: " +
              res[i].song +
              " || Artist: " +
              res[i].artist +
              " || Year: " +
              res[i].year
          );
        }
        runSearch();
      });
    });
}

function songSearch() {
  inquirer
    .prompt({
      name: "song",
      type: "input",
      message: "What song would you like to look for?"
    })
    .then(function(answer) {
      console.log(answer.song);
      var sql = "SELECT songs.year, songs.artist, songs.song, albums.album FROM songs LEFT JOIN albums ON songs.year = albums.year AND songs.artist = albums.artist"
      connection.query("SELECT * FROM top5000 WHERE ?", { song: answer.song }, function(err, res) {
        if (err) throw err;
        console.log(
          "Position: " +
            res[0].position +
            " || Song: " +
            res[0].song +
            " || Artist: " +
            res[0].artist +
            " || Year: " +
            res[0].year
        );
        runSearch();
      });
    });
}