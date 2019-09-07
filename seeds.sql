/* Seeds for SQL table. We haven't discussed this type of file yet */
USE bamazon;

/* Insert 10 Rows into your new table */
INSERT INTO products (product_name, department_name, price, stock_quantity, product_sales)
VALUES ("SSD Samsung", "Electronics", 80, 100, 0),
		("Logitech Anywhere 2", "Electronics", 120, 290, 0),
		("Polo shirt S", "Clothings", 40, 800, 0),
		("Microsoft Office 2019", "Software", 120, 600, 0),
		("SSD Logitech", "IT", 90, 300, 0);

USE bamazon;
INSERT INTO departments (department_name, over_head_costs)
VALUES ("Electronics", 1000),
	   ("Clothings", 6000)
