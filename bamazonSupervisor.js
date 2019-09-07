// Adding the database requirements
var connection = require("./lib/db");
// prompts for user input/selections used for menus
const prompt = require("prompts");
// Get the the module to formate table like
var Table = require("cli-table");
// for coloring the texts
const chalk = require("chalk");
// short for console.log
const log = console.log;
// dummy variable for async functions
let interval;

// entry point to the app that displays the menu
async function displayMenu() {
  log("\n");

  log(chalk.blue("\tMAIN MENU"));
  log("------------------------------------------------------------\n");

//   enquiry for the user
  const questions = [
    {
      type: "select",
      name: "value",
      message: "Select From the Menu",
      choices: [
        {
          title: chalk.blue("1 View Product Sales by Department"),
          description: "View department wise",
          value: "viewByDept"
        },
        {
          title: chalk.blue("2 Create New Department"),
          description: "Create New Department",
          value: "createDept"
        },
        {
          title: chalk.blue("3 Exit"),
          description: "Exit the application",
          value: "exit"
        }
      ]
    }
  ];

//   waiting for user input
  const answers = await prompt(questions, {
    onCancel: cleanup,
    onSubmit: cleanup
  });

//   handle the menu options
  switch (answers.value) {
    case "viewByDept":
      display();
      break;
    case "createDept":
      log("\033[2J");
      log("\n------------------------------------------------------------\n");

      log(
        chalk.yellow(
          "\tDepartments automatically added when new product is added.."
        )
      );
      log("------------------------------------------------------------\n");
      displayMenu();

      break;
    case "exit":
      log("\n------------------------------------------------------------\n");
      connection.end();
      log(chalk.red("\tExiting...."));
      log("------------------------------------------------------------\n");
      break;
    default:
      break;
  }
}

function cleanup() {
  clearInterval(interval);
}

// display the department table
function display() {
  var sql = `SELECT *, p.department_name, d.department_name,
            SUM(product_sales) AS p_sales
            FROM products AS p
            INNER JOIN departments AS d
            ON p.department_name=d.department_name
            GROUP BY d.department_name`;
  var query = connection.query(sql, function(err, res) {
    if (err) throw err;
    var table = new Table({
      head: [
        "department_id",
        "department_name",
        "over_head_costs",
        "product_sales",
        "total_profit"
      ]
    });

    res.forEach(function(e) {
      var overhead = e.over_head_costs;
      var sales = e.p_sales;
      var profit = sales - overhead;
      table.push([e.department_id, e.department_name, overhead, sales, profit]);
    });
    // display the table
    console.log(table.toString());
    displayMenu();
  });
}

// start after connection is good
if (connection._connectCalled) {
  displayMenu();
}
