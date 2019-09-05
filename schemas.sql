
/* Schema for SQL database/table.*/
DROP DATABASE IF EXISTS bamazon;

/* Create database */
CREATE DATABASE bamazon;
USE bamazon;

/* Create new table with a primary key that auto-increments, and a related fields*/
CREATE TABLE products (
  item_id INT NOT NULL AUTO_INCREMENT,
  product_name VARCHAR(100) NOT NULL,
  department_name VARCHAR(100) NOT NULL,
  price INT,
  stock_quantity INT,
  PRIMARY KEY (item_id)
);
ALTER TABLE products AUTO_INCREMENT=0;
