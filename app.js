var mysql = require('mysql');
var express = require('express')
var bodyParser = require('body-parser')
var cors = require('cors')
const hostname = '127.0.0.1';

// Set up express and listen at the port
const app = express()
app.listen(5000, () => console.log('========= ATLgardens listening on port 3000! =========='))
app.use(cors())
app.use(bodyParser.json())

// Connection to MySQL database
const connection = mysql.createConnection({
  host: 'academic-mysql.cc.gatech.edu',
  user: 'cs4400_team_37',
  password: 'tg7zvTd5',
  database: 'cs4400_team_37'
});

connection.connect(function(err) {
  if (err) throw err;
  console.log(" =================== Connected! ====================");
});


// =================== expressJS routing ======================
// GET is called when the front end wants to retrieve some data
// PUT is called when the front end wants to insert some data
// DELETE is called when the front end wants to delete data
// ============================================================
app.post('/login', function(req, res){
    // === What it expects ===
    // var payload = {
    //   email = "...",
    //   password = "..."
    // }
    // === what it responds ===
    // "0" for failure
    // "1" for success

    var email = req.body.email;
    var password = req.body.password;

    connection.query(
      'SELECT Email, Password FROM `User` WHERE Email = ? AND Password = ?', [email, password],
      function(err, results, fields) {
        if (results.length > 0 && results[0].Email == email && results[0].Password == password) {
          // 1 for success
          res.write("1");
        } else {
          // 0 for failure
          res.write("0");
        }

        res.end();
    });

});

app.post('/registration', function(req, res){
  // === What it expects ===
  // let payload = {
  //  "email": "test2@harvard.edu",
  //  "username": "testUser2",
  //  "password": "shgshYYVSH7",
  //  "type" : "Owner",
  //  "property": "Test Garden",
  //  "address": "555 Test Road",
  //  "city": "Atlanta",
  //  "zip": "30332",
  //  "acres": 2,
  //  "public": 1,
  //  "commercial": 0,
  //  "propType": "Farm",
  //  "items" : [["Pig"], ["Peruvian Lily"]]
  // }
  // === what it responds ===
  // "failed to add crop" for error failure
  // "failed to add user"
  // "exists" because user already exists
  // "1" for success

  var email = req.body.email;
  var password = req.body.password;
  var username = req.body.username;
  var type = req.body.type;
  var email = req.body.email;

  var id = Math.floor(Math.random()*90000) + 10000;
  var propName = req.body.property;
  var address = req.body.address;
  var city = req.body.city;
  var zip = req.body.zip;
  var acres = req.body.acres;
  var propType = req.body.propType;
  var public = req.body.public;
  var commercial = req.body.commercial;
  var items = req.body.items;
  for (i = 0; i < items.length; i++) {
    items[i].unshift(id);
  }

console.log(items);
  // A query like login to check if users already exists
  connection.query(
      'SELECT Email, Username FROM `User` WHERE Email = ? OR Username = ?', [email, username],
      function(err, results, fields) {
        if (results.length > 0) {
          // failure because the user already exists
          res.write("exists");
          res.end()
        } else {
          // Insert the new user
          connection.query(
            'INSERT INTO User(Username, Email, Password, UType) VALUES (?, ?, ?, ?)', [username, email, password, type],
            function(err, results, fields) {
              if (err == null) {
                // Success the new entry was added
                if (type == "Owner") {
                    // =======================
                    // Succces adding owner so add new property
                    connection.query(
                    'INSERT INTO Property(ID, Name, Size, Address, IsPublic, IsCommercial, OwnedBy, PType) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [id, propName, acres, address + city + zip, public, commercial, email, propType],
                    function(err, results, fields) {
                      console.log(err)

                      if (err == null) {
                        connection.query(
                        'INSERT INTO Grows_Raises(PId, IName) VALUES ?', [items],
                        function(err, results, fields) {
                          if (err == null) {
                            // Success the new entry was added to property
                           res.write("1");
                          res.end()

                          } else {
                            // failed due to error adding property
                            res.write("failed to add crop");
                            res.end()
                          }
                        });

                      } else {
                        // failed due to error adding property
                        res.write("failed to add property");
                        res.end()
                      }
                    });

                } else {
                  //Success added visitor
                  res.write("1");
                  res.end()
                }

              } else {
                // failed do to error
                res.write("failed to add user");
                res.end()
              }

          });
        }
    });

});

app.post('/properties', function(req, res){
  // What it need
  // var payload = {
  //  type = "ownerProps" OR "notOwner" OR "public" OR "conf" OR "unconf"
  //  email = "owneremail@gmail.com",
  //}
  // it will respond with an array of objects that contain the fields we need
  //  or "0" if failed

  var type = req.body.type;
  var email = req.body.email;
  var sql;
  if (type == "ownerProps") {
    // All properties for owned by a user
    var sql = "SELECT ID, Name, Address, ApprovedBy, PType, Size, IsPublic, IsCommercial, COUNT(Visits.Email), AVG(Rating) FROM `Property` Left Join `Visits` ON Property.ID = Visits.PId WHERE Property.OwnedBy = ? Group By Property";
  } else if (type == "notOwner") {
    // All properties not owned by a user
    var sql = "SELECT ID, Name, Address, ApprovedBy, PType, Size, IsPublic, IsCommercial, COUNT(Visits.Email), AVG(Rating) FROM `Property` Left Join `Visits` ON Property.ID = Visits.PId WHERE Property.OwnedBy != ? AND Property.ApprovedBy IS NOT NULL Group By Property.ID";
  } else if (type == "public") {
    // All public and confirmed properties
    var sql = "SELECT ID, Name, Address, ApprovedBy, PType, Size, IsPublic, IsCommercial, COUNT(Visits.Email), AVG(Rating) FROM `Property` Left Join `Visits` ON Property.ID = Visits.PId WHERE Property.IsPublic = 1 AND Property.ApprovedBy IS NOT NULL Group By Property.ID";
  } else if (type == "conf") {
    // All confirmed properties
    var sql = "SELECT ID, Name, Address, OwnedBy, ApprovedBy, PType, Size, IsPublic, IsCommercial, COUNT(Visits.Email), AVG(Rating) FROM `Property` Left Join `Visits` ON Property.ID = Visits.PId WHERE Property.ApprovedBy IS NOT NULL Group By Property.ID";
  } else if (type == "unconf") {
    // All unonfrimed properties
    var sql = "SELECT ID, Name, Address, OwnedBy, ApprovedBy, PType, Size, IsPublic, IsCommercial FROM `Property` WHERE Property.ApprovedBy IS NULL Group By Property.ID";
  }


  connection.query(sql, [email],
      function(err, results, fields) {
        console.log(results)
        console.log(err)
        if (results.length > 0 ) {
          // 1 for success
          res.write(JSON.stringify(results));
        } else {
          // 0 for failure
          res.write("0");
        }

        res.end();
    });


});

app.put('/manageProperty', function(req, res){
  // Will update information on a property or add a new one
  res.send("Access Granted!");

});

app.post('/users', function(req, res){
  // Will respond with the list of users requested (confirmed/unconfrimed)
  // Will respond the list of crops or animals requested (confirmed/unconfrimed)
  // What it need
  // var payload = {
  //  type = "visitor" OR "owner"
  //}
  // it will respond with an array of objects that contain the fields we need
  //  or "0" if failed

  var type = req.body.type;
  var sql;
  if (type == "visitor") {
    // All properties for owned by a user
    type = "Visitor";
    var sql = "SELECT User.Email, User.Username, COUNT(Visits.Email) FROM User LEFT JOIN Visits ON User.Email = Visits.Email WHERE User.UType = ? Group by (User.Email)";
  } else if (type == "owner") {
    // All properties for owned by a user
    type = "Owner";
    var sql = "SELECT User.Username, User.Email, COUNT(User.Email) FROM User LEFT JOIN Property ON User.Email = Property.OwnedBy WHERE User.UType = ? Group by (User.Email)";
  }

  connection.query(sql, [type],
      function(err, results, fields) {
        console.log(results)
        console.log(err)
        if (results.length > 0 ) {
          // 1 for success
          res.write(JSON.stringify(results));
        } else {
          // 0 for failure
          res.write("0");
        }

        res.end();
    });

});

app.post('/items', function(req, res){
  // Will respond the list of crops or animals requested (confirmed/unconfrimed)
  // What it need
  // var payload = {
  //  type = "animal" OR "crop"
  //  confirmed = 1 OR 0
  //}
  // it will respond with an array of objects that contain the fields we need
  //  or "0" if failed

  var type = req.body.type;
  var confirmed = req.body.confirmed;
  var sql;
  if (type == "animal") {
    // All properties for owned by a user
    type = "Animal";
    var sql = "SELECT Name, IType FROM `FarmItem` WHERE IType = ? AND isApproved = ?";
  } else if (type == "crop") {
    // All properties for owned by a user
    type = "Animal";
    var sql = "SELECT Name, IType FROM `FarmItem` WHERE IType != ? AND isApproved = ?";
  }

  connection.query(sql, [type, confirmed],
      function(err, results, fields) {
        console.log(results)
        console.log(err)
        if (results.length > 0 ) {
          // 1 for success
          res.write(JSON.stringify(results));
        } else {
          // 0 for failure
          res.write("0");
        }

        res.end();
    });

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
