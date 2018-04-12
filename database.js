const mysql = require('mysql2');

// create the connection to database
const connection = mysql.createConnection({
  host: 'academic-mysql.cc.gatech.edu',
  user: 'cs4400_team_37',
  password: 'tg7zvTd5',
  database: 'cs4400_team_37'
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

connection.query(
    'SELECT * FROM `User`;',
    function(err, results, fields) {
      console.log(results); // results contains rows returned by server
    //   console.log(fields); // fields contains extra meta data about results, if available
    }
  );