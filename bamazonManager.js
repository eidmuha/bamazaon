const prompt = require('prompts');
var Table = require('cli-table');

var inquirer = require("inquirer");

inquirer.registerPrompt('suggest', require('inquirer-prompt-suggest'));
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
var fuzzy = require('fuzzy');
var _ = require('lodash');

var mysql = require("mysql");


// for colorful texts on the console
const chalk = require('chalk');
const log = console.log;

var products = [];
var currenPrices = [];

let interval;


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
    log(chalk.green("------ connected successfully -------\n"))
    asyncCall();
  });

async function asyncCall(){
    const questions = [
       
        {
            type: 'select',
            name: 'value',
            message: 'Select From the Menu',
            choices: [
                { title: chalk.blue('1 View Products for Sale'), description: 'Select to view every available item', value: "viewProductsForSale"},
                { title: chalk.blue('2 View Low Inventory'), description: 'Select to view items with low inventory', value: "viewLowInventory"},
                { title: chalk.blue('3 Add to Inventory'), description: 'Select to add to inventory', value: "addToInventory"},
                { title: chalk.blue('4 Add New Productos'), description: 'Select to add a product', value: "addNewProduct" },
                { title: chalk.blue('5 Exit'), description: 'Exit the application', value: "exit" }
            ]
        }
    ];

    const answers = await prompt(questions, {onCancel:cleanup, onSubmit:cleanup});

    switch (answers.value) {
        case "viewProductsForSale":        
        case "viewLowInventory": 
        case "addToInventory":            
            display(answers);
            break;
        case "addNewProduct":            
            addNewProduct(answers)
            break;
        case "exit":     
        log("\n------------------------------------------------------------\n")       
            connection.end()
            log(chalk.red("\tExiting...."))
        log("\------------------------------------------------------------\n")       

            break;
    
        default:
            break;
    }
};

function cleanup() {
    clearInterval(interval);
}

function addNewProduct() {


    log("\n-------------------"+chalk.blue("ADD NEW PRODUCTS HERE")+"------------------\n")       
    
  inquirer
  .prompt([
    {
      name: "product_name",
      type: "input",
      message: "Enter the name of Item: ",
      validate: function(val) {
        return val ? true : 'Write the product name';
      },
    },
    {
      name: "department_name",
      type: "input",
      message: "Department: ",
      validate: function(val) {
        return val ? true : 'Write the department name';
      },
    },
    {
      name: "price",
      type: "input",
      message: "Price: ",
      validate: function(value) {
        if (isNaN(value) === false) {
          return true;
        }
        return false;
      }
    },
    {
        name: "stock_quantity",
        type: "input",
        message: "Quantity: ",
        validate: function(value) {
            if (isNaN(value) === false) {
              return true;
            }
            return false;
        }
    },
  ])
  .then(function(answer) {
    // when finished prompting, insert a new item into the db with that info
    connection.query(
      "INSERT INTO products SET ?",
      {
        product_name: answer.product_name,
        department_name: answer.department_name,
        price: answer.price,
        stock_quantity: answer.stock_quantity
      },
      function(err, res) {
        if (err) throw err;
        log(chalk.green("\n------------------------------------------------------------\n")     )  

        log(chalk.blue("\t"+res.affectedRows + " product(s) inserted!\n"));
        log(chalk.green("------------------------------------------------------------\n")  )     

        asyncCall()
      }
    );
  });







    // console.log("Updating all Rocky Road quantities...\n");
    // var query = connection.query(
    //   "INSERT INTO products SET ?",
    //   [
    //     {
    //       product_name: 100
    //     },
    //     {
    //       department_name: "Rocky Road"
    //     },
    //     {
    //         price: "Rocky Road"
    //     },
    //     {
    //         stock_quantity: "Rocky Road"
    //     }
    //   ],
    //   function(err, res) {
    //     if (err) throw err;
    //     // Call deleteProduct AFTER the UPDATE completes
    //     deleteProduct();
    //   }
    // );
  
    // // logs the actual query being run
    // console.log(query.sql);
  }

// 
function display(answers){

    log(chalk.green("------------------------------------------------------\n"))
    var tableHeading = '';
    var query = connection.query("SELECT * FROM products",  function(err, res) {
        result = res;
        if (err) throw err;
        // instantiate
        var table = new Table({
            head: ['ID', 'PRODUCT NAME', 'PRICE', 'AVAILABLE QUANTITY']        
        });        
        
        if (answers.value =="viewLowInventory") {
            tableHeading = chalk.yellow("LOW INVENTORIES");
            res.forEach(function(element, index) {
                // log(element.stock_quantity)
                if (element.stock_quantity <= 300) {
                    var quantiy = chalk.green(element.stock_quantity)
                    table.push([chalk.blue(index), element.product_name, element.price, quantiy]);             

                }
            });
        }else {
            tableHeading = chalk.yellow("ALL INVENTORIES");
            res.forEach(function(element, index) {
                    var quantiy = chalk.green(element.stock_quantity)
                    table.push([chalk.blue(index), element.product_name, element.price, quantiy]);   
                    products.push(element.product_name)
                    currenPrices.push(element.price)
            });
        }

        if (answers.value =="addToInventory") {

            addToInventory(answers)
        }else{

            displayTable(tableHeading, table);
        }

        
        
     

    });
}

function displayTable(tableHeading, table){
    log(`\n       LIST OF ${tableHeading} IN STOCK      \n`);
    log(table.toString());
    // table.push([])
    log(chalk.green("------------------------------------------------------\n"))
    asyncCall();      

}

function addToInventory(answers){
    log('\033[2J');

    const questions = [
        {
            type: 'autocomplete',
            name: 'item_id',
            suggestOnly: true,
            message: 'Add More To? ',
            source: searchProducts,
            pageSize: 4,
            validate: function(val) {
              return val ? true : 'Write the product ID';
            },
        },
        {
            type: 'input',
            name: 'quantity',
            message: 'How many you want?: ',
            default: 1,
        },
        {
            type: 'input',
            name: 'price',
            message: 'Price: ',
            default: 1,
        },
        {
            type: 'list',
            name: 'confirm',
            message: 'Please Confirm the Details?',
            initial: true,
            choices: [
              'Yes',
              'No',
            ]
          }
      ];

      

      inquirer.prompt(questions).then(answers => {
        
        if (answers.confirm=='Yes') {

            var sql = `UPDATE products SET stock_quantity = stock_quantity + ${parseInt(answers.quantity)}, price = price + ${answers.price} WHERE item_id  = ${parseInt(answers.item_id)+1}`;
            log(sql)
           var query = connection.query(sql, function(err, res){
                if (err) throw err;

                log(chalk.green("\n------------------------------------------------------\n"));                  
                log(res.affectedRows + " product updated!\n")
                log(chalk.green("------------------------------------------------------\n"));                  

                asyncCall()
            });


        }else{
            log(chalk.green("\n------------------------------------------------------\n"));                  
            log(chalk.yellow("\tYou cancelled adding more to stock"))
            log(chalk.green("\n------------------------------------------------------\n"));                  

          asyncCall()

        }
    });


}


function searchProducts(answers, input) {
    // log(products)
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
                return el.index +" -> "+ products[(el.index).toString()] +" | "+ currenPrices[(el.index).toString()];
          })
        );
      }, _.random(30, 500));
    });
  }

