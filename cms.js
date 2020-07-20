// import dependencies
var inquirer = require("inquirer");
var mysql = require("mysql");

// create a variable to store database name
var myDatabase = "cms_DB"

// create mysql connection
var connection = mysql.createConnection(
    {
        host: "localhost",
        port: 3306,
        user: "root",
        password: "password",
        // database: "liyaManagement_DB"
        database: myDatabase
    }
);

// connect to mysql server and database
connection.connect(function(err) {
    if(err) throw err;
    console.log(`Successfully connected to database ${myDatabase}`);
    // call the function to start the application
    cms();
});

function cms() {
    inquirer.prompt(
        {
            name: "action",
            type: "list",
            message: "What would you like to do?",
            choices: [
                "View All Employees",
                "View All Employees By Department",
                "View All Employees By Manager",
                "Add Employee",
                "Remove Employee",
                "Update Employee Role",
                "Update Employee Manager",
                "EXIT"
            ]
        }
    )
    .then(function(answer) {
        switch(answer.action) {
            case "View All Employees":
                viewAllEmployees();
                break;
            case "View All Employees By Department":
                viewAllEmployeesByDepartment();
                break;
            case "View All Employees By Manager":
                viewAllEmployeesByManager();
                break;
            case "Add Employee":
                addEmployee();
                break;
            case "Remove Employee":
                removeEmployee();
                break;
            case "Update Employee Role":
                updateEmployeeRole();
                break;
            case "Update Employee Manager":
                updateEmployeeManager();
                break;
            case "EXIT":
                console.log("See you next time.")
        }
    });
}

function viewAllEmployees() {
    // query to get all employees
    var query = "SELECT id AS emloyee_id, first_name, last_name FROM employee";
    connection.query(query, function(err, res) {
        if(err) throw err;
        console.table(res);
        // call the cms function to start over the process
        cms();
    })
}

function viewAllEmployeesByDepartment() {
    // declare an array variable to store department names
    var departmentList = [];
    // to query the department names
    // first level query
    var query = "SELECT name FROM department";
    connection.query(query, function(err, res) {
        if(err) throw err;
        // push department name to the departments array
        for(var i = 0; i < res.length; i++) {
            departmentList.push(res[i].name);
        }
        // do inquirer prompt after getting the query back
        inquirer.prompt(
            {
                name: "department",
                type: "list",
                message: "What is the department?",
                choices: departmentList
            }
        )
        .then(function(answer) {
            var query = "SELECT employee.id AS employee_id, employee.first_name, employee.last_name, department.name AS department";
            query += " FROM ( (employee INNER JOIN role ON employee.role_id = role.id)";
            query += " INNER JOIN department ON role.department_id = department.id)";
            query += " WHERE ?";

            var filter = {"department.name": answer.department};
            // second level query, the query employees by department
            connection.query(query, filter, function(err, res) {
                if(err) throw err;
                console.table(res);
                // call cms function to start over
                cms();
            }) //end of second level query
        });
    }) // end of first level query
}

function viewAllEmployeesByManager() {
        // declare an array variable to store department names
        var managerList = [];
        // to query the department names
        var query = "SELECT employee.id, employee.first_name, employee.last_name "
        query += "FROM employee ";
        query += "INNER JOIN role ON employee.role_id = role.id ";
        query += "Where role.title LIKE '%manager%' OR role.title LIKE '%director%' OR role.title IN ( 'CEO',  'COO') ";
        // first level query, to query all managers
        connection.query(query, function(err, res) {
            if(err) throw err;
            // push department name to the departments array
            for(var i = 0; i < res.length; i++) {
                managerList.push(JSON.stringify(res[i]));
            }
            inquirer.prompt(
                {
                    name: "manager",
                    type: "list",
                    message: "Who is the manager?",
                    choices: managerList
                }
            )
            .then(function(answer) {
                var manager_id = JSON.parse(answer.manager).id;
                var query = "SELECT id AS employee_id, first_name, last_name";
                query += " FROM employee";
                query += " WHERE ?";
    
                var filter = {manager_id: manager_id};
                // second level query, to query employees by manager
                connection.query(query, filter, function(err, res) {
                    if(err) throw err;
                    console.table(res);
                    // call cms function to start over
                    cms();
                }) // end of second level query
            });
        }) // end of first level query
    
}

function addEmployee() {
    // create object variable. the key would be employee name, the value would be employee id
    // the employees are manager level or up
    let managerObj ={};
    // create object variable. the key would be role title name, the value would be role  id
    let roleObj = {};
    
    let query = "SELECT employee.id, employee.first_name, employee.last_name, role.title, role.id  "
    query +="FROM employee INNER JOIN role ON employee.role_id = role.id ";
    query += "Where role.title LIKE '%manager%' OR role.title LIKE '%director%' OR role.title IN ( 'CEO',  'COO') ";
    
    // first level query, to query all employees that are manager level or up
    connection.query(query, function(err, res) {
        if(err) throw err;
        for(const row of res) {
            let manager = row.first_name + " " + row.last_name;
            managerObj[manager] = row.id;
        }
       // create the managerList array, which includes manager employees' name
        const managerList = Object.keys(managerObj)
        
        // second level query, inside the first level query
        // query the title names
        connection.query("SELECT role.title, role.id FROM role ", function(err, res) {
            if(err) throw err;
            for(const row of res) {
                roleObj[row.title] = row.id;
            }
            
            // create the roleList array, which includes all titles
            const roleList = Object.keys(roleObj)

            inquirer.prompt(
                [
                    {
                        name: "first_name",
                        type: "input",
                        message: "Please input the first name: "
                    },
                    {
                        name: "last_name",
                        type: "input",
                        message: "Please input the last name: "
                    },
                    {
                        name: "title",
                        type: "list",
                        message: "What is the employee's role?",
                        choices: roleList
                    },
                    {
                        name: "manager",
                        type: "list",
                        message: "Who is the employee's manager?",
                        choices: managerList
                    }
                ]
            )
            .then(function(answer) {
                let query = "INSERT INTO employee (first_name, last_name, role_id, manager_id) ";
                query += "VAlUES (" +"'" +  answer.first_name + "', '" + answer.last_name + "','" + roleObj[answer.title] + "','" + managerObj[answer.manager] +"')"
                // third level query, insert employee into table
                connection.query(query, function(err, res) {
                    if(err) throw err;
                    console.log("Added employee successfully");
                    // call cms function to start over
                    cms();
                }) //end of third level query
            })
        }) // end of first query
    }); // end of second query
}

function updateEmployeeManager() {
    // create object variable. the key would be employee name, the value would be employee id
    let employeeObj = {}
    let query = "SELECT id, first_name, last_name FROM employee"
    // first level query, to get all employees
    connection.query(query, function(err, res) {
        if(err) throw err;
        for(const row of res) {
            let employee = row.first_name + " " + row.last_name;
            employeeObj[employee] = row.id;
        }
        // create the employeeList array, which includes employees' name
        const employeeList = Object.keys(employeeObj)

        inquirer.prompt({
            name: "employee",
            type: "list",
            message: "Which employee's manager do you want to update?",
            choices: employeeList
        })
        .then(function(answer){
            // create object variable. the key would be manager name, the value would be employee id
            let managerObj ={};
            
            let query = "SELECT employee.id, employee.first_name, employee.last_name, role.title, role.id  "
            query +="FROM employee INNER JOIN role ON employee.role_id = role.id ";
            query += "Where role.title LIKE '%manager%' OR role.title LIKE '%director%' OR role.title IN ( 'CEO',  'COO') ";
            // second level query, to get employees who are manager level or up
            connection.query(query, function(err, res) {
                if(err) throw err;
                for(const row of res) {
                    let manager = row.first_name + " " + row.last_name;
                    managerObj[manager] = row.id;
                }
               // create the manage list array, which includes the name of employees who are manager level or up
                const managerList = Object.keys(managerObj)

                inquirer.prompt({
                    name: "manager",
                    type: "list",
                    message: "Which one do you want to set as manager for the selected employee?",
                    choices: managerList
                })
                .then(function(answer1) {
                    let query = "UPDATE employee SET manager_id = ? WHERE id = ?"
                    let filter = [managerObj[answer1.manager], employeeObj[answer.employee]]
                    // third level query, to update the employee's manager
                    connection.query(query, filter, function(err, res) {
                        if(err) throw err;
                        console.log("The employee's manager has been updated")
                        // call cms function to start over
                        cms();
                    }) //end of third level query
                })
            }) //end of second level query
        })
    }) // end of first level query
} // end of the function updateEmployeeManager

function updateEmployeeRole() {
    // create two object variables. the employee/role name as key, the id as value
    let employeeObj = {}
    let roleObj ={};
    let query = "SELECT id, first_name, last_name FROM employee"
    // first level query, to query all employees
    connection.query(query, function(err, res) {
        if(err) throw err;
        for(const row of res) {
            let employee = row.first_name + " " + row.last_name;
            employeeObj[employee] = row.id;
        }
        // create employeeList array, to store employee names
        const employeeList = Object.keys(employeeObj)
        
        // second level query
        connection.query("SELECT role.title, role.id FROM role ", function(err, res) {
            if(err) throw err;
            for(const row of res) {
                roleObj[row.title] = row.id;
            }
            const roleList = Object.keys(roleObj)
            // add an option to input a new title name that doesn't exist in the role table
            // roleList.push("Input new title name")

            inquirer.prompt(
                [
                    {
                        name: "employee",
                        type: "list",
                        message: "Which employee's role do you want to update?",
                        choices: employeeList
                    },
                    {
                    name: "title",
                    type: "list",
                    message: "Which one do you want to set as title for the selected employee?",
                    choices: roleList
                    }
                ]
            )
            .then(function(answer) {
                let query = "UPDATE employee SET role_id = ? WHERE id = ?"
                let  filter = [roleObj[answer.title], employeeObj[answer.employee]]
                // third level query
                connection.query(query, filter, function(err, res) {
                    if(err) throw err;
                    console.log("The employee's role has been updated")
                    // call cms function to start over
                    cms()
                }) // end of third level query
            })
    
        }) // end of second level query
            
     }) //end of first level query
}

function removeEmployee() {
    let employeeObj = {}
    let employeeManagerObj ={}
    // Create employee list by query employee table
    // first level query
    let query = "SELECT id, first_name, last_name, manager_id FROM employee"
    connection.query(query, function(err, res) {
        if(err) throw err;
        for(const row of res) {
            // set employee name as key, employee id as value
            let employee = row.first_name + " " + row.last_name
            employeeObj[employee] = row.id
           // create a new object, the key is employee's name, the value is employee's manager_id
            employeeManagerObj[employee] = row.manager_id
        }
        // create an array which compose of the key of employeeObj
        const employeeList = Object.keys(employeeObj)

        // use employeeList array as choices
        inquirer.prompt({
            name: "employee",
            type: "list",
            message: "Which employee's manager do you want to update?",
            choices: employeeList
        })
        .then(function(answer){
            // second level query
            // find people whose manager is the employee
            let query = "SELECT id, first_name, last_name, manager_id  "
            query +="FROM employee WHERE manager_id = ? "
            let filter = [employeeObj[answer.employee]]
            connection.query(query, filter, function(err, res) {
                if(err) throw err;
                if(res.length > 0) 
                // the employee has people report to him, need to update the employee's  team member's manager id  before delete the employee. 
                // The employee's team members' manager id will be updated to the employee's manager id
                    {
                         console.log(`The following employees' manager will be updated to ${answer.employee}'s manager `)
                         console.table(res)
                        // update the manager_id for each one whose manager is the employee
                         // third level query
                         connection.query(
                            "UPDATE employee SET manager_id = ? WHERE manager_id = ?",
                            // the first is the employee's manager_id, the second one is employee's id, which also is the team member's current manager_id
                            [employeeManagerObj[answer.employee], employeeObj[answer.employee] ],
                            function(err, res) {
                                if(err) throw err
                                // remove the employee from the table of employee after update the employee's team member's manager_id
                                // fourth level query
                                connection.query (
                                    "DELETE FROM employee WHERE id = ?",
                                    [employeeObj[answer.employee]],
                                    function(err, res1) {
                                        if(err) throw err
                                        console.log(`The employee ${answer.employee} has been removed`)
                                        cms()
                                        // 🍎the res doesn't work here, need to find the reason
                                        // console.log(`The following employees' manager has been updated to ${answer.employee}'s manager`)
                                        // console.table(res) // the res is from the query in upper level
                                    }
                                ) // end of fourth level query
                            }
                        ) // end of third level query
                    } 
                else 
                    {
                        // third level query
                        connection.query (
                            "DELETE FROM employee WHERE id = ?",
                            [employeeObj[answer.employee]],
                            function(err, res2) {
                                if(err) throw err
                                console.log(`The employee ${answer.employee} has been removed`)
                                cms()
                            }
                        )
                    }
        
            }) // end of second level query
        })
    }) // end of first level query
} // end of function removeEmployee

