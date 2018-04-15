const mysql = require('mysql');
const express = require('express')
const bodyParser = require('body-parser')
const hostname = '127.0.0.1';

// Set up express and listen at the port
const app = express()
app.listen(3000, () => console.log('ATLgardens listening on port 3000!'))

// Connection to MySQL database
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


// =================== expressJS routing ======================
// GET is called when the front end wants to retrieve some data
// PUT is called when the front end wants to insert some data
// DELETE is called when the front end wants to delete data
// ============================================================
app.get('/login', function(req, res){
  res.send("Access Granted!");

  var body = JSON.parse(req.body);
  var email = body.email;
  var password = body.password;

  var results = 0;
  connection.query(
    "SELECT * FROM `User` WHERE email = " + email + " password = " + password,
    function(err, results, fields) {
    if (results.length > 0) {
      results = 1;
    }
    console.log(results); // results contains rows returned by server
    //console.log(fields); // fields contains extra meta data about results, if available
  });

  res.send(results);

});

app.put('/registration', function(req, res){
  // Will register a new owner or visitor and respond with
  // success or failure
  res.send("New User Created!");

});

app.get('/properties', function(req, res){
  // Will respond with a list of properties determined by the
  // request. Or with more info on a single property
  res.send("Your Properties!");


});

app.put('/manageProperty', function(req, res){
  // Will update information on a property or add a new one
  res.send("Access Granted!");

});

app.get('/users', function(req, res){
  // Will respond with the list of users requested (confirmed/unconfrimed)
  res.send("Access Granted!");

});

app.get('/items', function(req, res){
  // Will respond the list of crops or animals requested (confirmed/unconfrimed)
  res.send("Access Granted!");

});


app.get('/visits', function(req, res){
  // Will respond with a list of visits youve made
  res.send("Access Granted!");

});

app.put('/approve', function(req, res){
  // Will approve items requested (users, crops, properties, etc)
  // Add properties, users, crops, visits
  res.send("Access Granted!");

});

app.delete('/delete', function(req, res){
  // Will delete information requested by the front end
  // Users, properties, crops, visits
  res.send("Access Granted!");

});

// ============================================================



// connection.query(
//   'SELECT * FROM `User`;',
//   function(err, results, fields) {
//   console.log(results); // results contains rows returned by server
//   //console.log(fields); // fields contains extra meta data about results, if available
// });
