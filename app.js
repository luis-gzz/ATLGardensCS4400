const http = require('http');
const mysql = require('mysql2');
const hostname = '127.0.0.1';
const port = 3000;

// create the connection to database
const connection = mysql.createConnection({
  host: 'academic-mysql.cc.gatech.edu',
  user: 'cs4400_team_37',
  password: 'tg7zvTd5',
  database: 'cs4400_team_37'
});

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
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

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});