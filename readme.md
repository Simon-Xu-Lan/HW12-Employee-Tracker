1. run liyaManagement.sql to create database liyaManagement_DB, and create three tables
2. initialize the database to load the csv file into database.
    *  since table "role" has foreign key refer to table "department", and employee has foreign key refer to table "role", the department.js has to be run first, then role.js, then employee.js 
    *  run the department.js first to load department data from department.csv into department table.
    *  then run the role.js to load role data from role.csv into role table
    *  finally to run employee.js to load role date from liyaEmployee.csv into employee table
3. once the data has been loaded to database, run cms.js to start the main application.
