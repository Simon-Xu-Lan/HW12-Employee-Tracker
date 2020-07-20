//import CSV data into MySQL Database table
//reference: https://bezkoder.com/node-js-csv-mysql/

const fs = require("fs");
const mysql = require("mysql");
//use fast-csv module to read CSV file
const fastcsv = require("fast-csv"); 

// create a new connection to the database
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "liyaManagement_DB"
});
    
// import role.csv into role table
let stream = fs.createReadStream("./data/role.csv");
let csvData = [];
let csvStream = fastcsv
    .parse()
    .on("data", function(data) {
        csvData.push(data);
    })
    .on("end", function() {
        // remove the first line: header
        csvData.shift();

        // open the connection
        connection.connect(error => {
            if (error) {
                console.error(error);
            } else {
                let query = "INSERT INTO role (id, title, salary, department_id, currency, type) VALUES ?";
                connection.query(query, [csvData], (error, response) => {
                console.log(error || response);
                });
            }
        });
    });

stream.pipe(csvStream);
