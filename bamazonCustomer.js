var connection = require("./lib/db");
var fuzzy = require("fuzzy");
var _ = require("lodash");
var Table = require("cli-table");
var inquirer = require("inquirer");
inquirer.registerPrompt("suggest", require("inquirer-prompt-suggest"));
inquirer.registerPrompt(
  "autocomplete",
  require("inquirer-autocomplete-prompt")
);

const chalk = require("chalk");
const log = console.log;

var products = [];
var result;

function display() {
  console.log("       LIST OF PRODUCTS IN STOCK      \n");
  var query = connection.query("SELECT * FROM products", function(err, res) {
    result = res;
    if (err) throw err;
    // instantiate
    var table = new Table({
      head: ["ID", "PRODUCT NAME", "PRICE", "AVAILABLE QUANTITY"]
    });

    res.forEach(function(element, index) {
      // table is an Array
      table.push([
        index,
        element.product_name,
        element.price,
        element.stock_quantity
      ]);
      products.push(element.product_name);
    });
    console.log(table.toString());
    log(
      chalk.green("------------------------------------------------------\n")
    );

    runSearch();
  });
}

display();

function runSearch() {
  log("\n________________PLEASE PLACE ORDER HERE________________");
  const questions = [
    {
      type: "autocomplete",
      name: "item_id",
      suggestOnly: true,
      message: "Which product you want to buy(Choose ID)? ",
      source: searchProducts,
      pageSize: 4,
      validate: function(val) {
        return val ? true : "Type something!";
      }
    },
    {
      type: "input",
      name: "quantity",
      message: "How many you want?: ",
      default: 01
    },
    {
      type: "list",
      name: "confirm",
      message: "Please Confirm Your Order?",
      initial: true,
      choices: ["Yes", "No"]
    }
  ];

  inquirer.prompt(questions).then(answers => {
    // log(answers)
    if (answers.confirm == "Yes") {
      placeOrder(answers);
    } else {
      log(
        chalk.green(
          "\n------------------------------------------------------\n"
        )
      );

      askToExit(answers);
    }
  });
}

function placeOrder(answers) {
  for (let index = 0; index < result.length; index++) {
    if (result[index].item_id == parseInt(answers.item_id) + 1) {
      if (result[index].stock_quantity < answers.quantity) {
        log(
          chalk.green("------------------------------------------------------")
        );
        log(
          "\tSorry, " +
            chalk.red(result[index].stock_quantity) +
            " " +
            chalk.blue(result[index].product_name) +
            " available in stock.\n"
        );
        log(
          chalk.green(
            "------------------------------------------------------\n"
          )
        );

        askToExit();
      } else {
        var cost = answers.quantity * result[index].price;
        var updatequery = `UPDATE products
                            SET  stock_quantity = ${result[index]
                              .stock_quantity - answers.quantity},
                            product_sales = ${result[index].product_sales +
                              cost}
                            WHERE item_id = ${parseInt(answers.item_id) + 1};`;
        connection.query(updatequery, function(err, res) {
          if (err) {
            throw err;
          }
          log(
            chalk.green(
              "------------------------------------------------------\n"
            )
          );
          log(chalk.blue("\t YOUR CURRENT ORDER"));
          var table = new Table({
            head: ["ID", "PRODUCT NAME", "PRICE", "QUANTITY", "PRICE"]
          });
          table.push([
            result[index].item_id,
            result[index].product_name,
            result[index].price,
            answers.quantity,
            cost
          ]);
          console.log(table.toString());
          log(
            chalk.green(
              "------------------------------------------------------\n"
            )
          );

          askToExit();
        });
      }
    }
  }
}

function askToExit() {
  const questions = [
    {
      type: "list",
      name: "exit",
      message: "Do you want to place ANOTHER order? ",
      choices: ["Yes", "No"]
    }
  ];

  inquirer.prompt(questions).then(answers => {
    if (answers.exit == "Yes") {
      log("\033[2J");
      runSearch();
    } else {
      log("\033[2J");
      log("\n\tThanks for shopping with us.\n\n");
      connection.end();
    }
  });
}

// autocomplete functions
function searchProducts(answers, input) {
  var temp = [];
  for (let index = 0; index < products.length; index++) {
    temp[index] = index.toString();
  }
  input = input || "";

  return new Promise(function(resolve) {
    setTimeout(function() {
      var fuzzyResult = fuzzy.filter(input, temp);
      resolve(
        fuzzyResult.map(function(el) {
          return el.index + " " + products[el.index.toString()];
        })
      );
    }, _.random(30, 500));
  });
}
