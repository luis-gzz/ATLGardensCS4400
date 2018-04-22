var mysql = require('mysql');
var express = require('express')
var bodyParser = require('body-parser')
var cors = require('cors')
const hostname = '127.0.0.1';

// Set up express and listen at the port
const app = express()
app.listen(3000, () => console.log('========= ATLgardens listening on port 3000! =========='))
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

app.get('/landing-page')


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

    console.log("login attempt" + email + " " + password);

    connection.query(
      'SELECT Email, Password, UType FROM `User` WHERE Email = ? AND Password = ?', [email, password],
      function(err, results, fields) {
        if (results.length > 0 && results[0].Email == email && results[0].Password == password) {
          // 1 for success
          res.write(results[0].UType);
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
  // TODO: Fix?
    item_arr = []
    // Something needs to be changed about this
    for (i = 0; i < items.length; i++) {
      item_arr[i] = [id, items[i]];
    }

  // for (i = 0; i < items.length; i++) {
  //   items[i].unshift(id);
  // }

  console.log("Registering user " + username);

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
          console.log(username);
          console.log(email);
          console.log(password);
          console.log(type);
          connection.query(
            'INSERT INTO User(Username, Email, Password, UType) VALUES (?, ?, ?, ?)', [username, email, password, type],
            function(err, results, fields) {
              if (err == null) {
                // Success the new entry was added
                if (type == "Owner") {
                  console.log("At owner")
                    // =======================
                    // Succces adding owner so add new property
                    connection.query(
                    'INSERT INTO Property(ID, Name, Size, Address, IsPublic, IsCommercial, OwnedBy, PType) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [id, propName, acres, address + city + zip, public, commercial, email, propType],
                    function(err, results, fields) {
                      console.log(err)

                      if (err == null) {
                        console.log(items);
                        connection.query(
                        'INSERT INTO Grows_Raises(PId, IName) VALUES ?', [item_arr],
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

  console.log("Accessing properties with email " + email + " and owner type " + type);
  var sql;
  if (type == "ownerProps") {
    // All properties for owned by a user
    var sql = "SELECT ID, Name, Address, ApprovedBy, PType, Size, IsPublic, IsCommercial, COUNT(Visits.Email) AS Count, AVG(Rating) AS Avg FROM `Property` Left Join `Visits` ON Property.ID = Visits.PId WHERE Property.OwnedBy = ? Group By Property.ID";
  } else if (type == "notOwner") {
    // All properties not owned by a user
    var sql = "SELECT ID, Name, Address, ApprovedBy, PType, Size, IsPublic, IsCommercial, COUNT(Visits.Email) AS Count, AVG(Rating) AS Avg FROM `Property` Left Join `Visits` ON Property.ID = Visits.PId WHERE Property.OwnedBy != ? AND Property.ApprovedBy IS NOT NULL Group By Property.ID";
  } else if (type == "public") {
    // All public and confirmed properties
    var sql = "SELECT ID, Name, Address, ApprovedBy, PType, Size, IsPublic, IsCommercial, COUNT(Visits.Email) AS Count, AVG(Rating) AS Avg FROM `Property` Left Join `Visits` ON Property.ID = Visits.PId WHERE Property.IsPublic = 1 AND Property.ApprovedBy IS NOT NULL Group By Property.ID";
  } else if (type == "conf") {
    // All confirmed properties
    var sql = "SELECT ID, Name, Address, OwnedBy, ApprovedBy, PType, Size, IsPublic, IsCommercial, COUNT(Visits.Email) AS Count, AVG(Rating) AS Avg FROM `Property` Left Join `Visits` ON Property.ID = Visits.PId WHERE Property.ApprovedBy IS NOT NULL Group By Property.ID";
  } else if (type == "unconf") {
    // All unonfrimed properties
    var sql = "SELECT ID, Name, Address, OwnedBy, ApprovedBy, PType, Size, IsPublic, IsCommercial FROM `Property` WHERE Property.ApprovedBy IS NULL Group By Property.ID";
  } else if (type == "id") {
    var sql = "SELECT ID, Name, Address, OwnedBy, ApprovedBy, PType, Size, IsPublic, IsCommercial FROM `Property` WHERE Property.ID = ?";
  } else {
      console.log("Type not found");
  }

  console.log("Executing " + sql);

  connection.query(sql, [email],
      function(err, results, fields) {
        //console.log(results)
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

app.post('/info', function(req, res){
  // gets info on a property
  // var payload = {
  //  id = the property id
  //}
  // it will respond with an array of objects that contain the fields we need
  //  or "0" if failed

  var id = req.body.id;

  console.log("getting info for property id: ", id);

  var sql = "SELECT Property.Name, Property.Ownedby, COUNT(Visits.Email) AS Count, Property.Address, AVG(Visits.Rating) AS Avg, Property.Size, Property.PType, Property.IsPublic, Property.IsCommercial, Property.ID, Grows_Raises.IName FROM Property " +
    "LEFT JOIN Visits ON Property.ID = Visits.PId " +
    "LEFT JOIN Grows_Raises ON Property.ID = Grows_Raises.PId WHERE Property.ID = ? Group by (Property.ID)"

  var sql2 = "SELECT Grows_Raises.IName, FarmItem.IType FROM Grows_Raises, FarmItem " +
    "WHERE PId = ? AND FarmItem.Name = Grows_Raises.IName"

  var info;
  connection.query(sql, [id],
      function(err, results, fields) {
        console.log(results)
        console.log(err)
        if (results.length > 0 ) {
          info = results;
          connection.query(sql2, [id],
          function(err, results, fields) {
            console.log(results)
            console.log(err)
            if (results.length > 0 ) {
              // 1 for success
              info[0].IName = new Array(results.length);
              for (i = 0; i < results.length; i++) {
                info[0].IName[i] = [results[i].IName, results[i].IType];
              }
              console.log(info)
              res.write(JSON.stringify(info));
            } else {
              // 0 for failure
              res.write("0");
            }

           res.end();
          });
        } else {
          // 0 for failure
          res.write("0");
          res.end();
        }


    });


});

app.post('/add', function(req, res){
  // Will add items requested (crops, properties, etc)
  // Add properties and visits
  //   for visit
  // var payload = {
  //  what = "logVisit",
  //  pID = 28282,
  //  email = "user@mail.com",
  //  date = 12/1/12,
  //  rating = 5
  // }
  //  for property
  // let payload = {
  //  "what" = "addProp",
  //  "email": "test2@harvard.edu",
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
  //   for item
  // var payload = {
  //  what = "addItem",
  //  iName = "Alpaca",
  //  iType = "Animal"
  // }

  var what = req.body.what;
  var email = req.body.email;

  var id = req.body.pID;
  var date = req.body.date;
  var rating = req.body.rating;

  var propName = req.body.property;
  var address = req.body.address;
  var city = req.body.city;
  var zip = req.body.zip;
  var acres = req.body.acres;
  var propType = req.body.propType;
  var public = req.body.public;
  var commercial = req.body.commercial;
  var items = req.body.items;

  var iName = req.body.iName;
  var iType = req.body.iType;

  var sql;
  var sql2;

  console.log("Adding to DB");

  if (what == "logVisit") {
    sql = "INSERT INTO Visits(PID, Email, VDate, Rating) VALUES (?, ?, ?, ?)";

    connection.query(sql, [id, email, date, rating],
      function(err, results, fields) {
        console.log(results)
        console.log(err)
        if (err == null) {
          // 1 for success
          res.write(JSON.stringify(results));
        } else {
          // 0 for failure
          res.write("0");
        }

        res.end();
    });

  } else if (what == "addProp") {
    sql = "INSERT INTO Property(ID, Name, Size, Address, IsPublic, IsCommercial, OwnedBy, PType) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    sql2 = 'INSERT INTO Grows_Raises(PId, IName) VALUES (?, ?)';
    id = Math.floor(Math.random()*90000) + 10000;


    item_arr = []
    // Something needs to be changed about this
    for (i = 0; i < items.length; i++) {
      item_arr[i] = [id, items[i]];
    }

    console.log(item_arr);

    connection.query(sql, [id, propName, acres, address + " " + city + " " + zip, public, commercial, email, propType],
      function(err, results, fields) {
        console.log(results)
        console.log(err)
        if (err == null) {
          for (var i = 0; i < item_arr.length; i++) {

          connection.query(sql2, [item_arr[i][0], item_arr[i][1]],
            function(err, results, fields) {
              console.log(results)
              console.log(err)
              if (err == null) {
                // 1 for success
                // Weird result when trying to insert two grows/raises
                //res.write("1");
              } else {
                // 0 for failure
                res.write("failed crop");
              }
            });
        }
        } else {
          // 0 for failure
          res.write("failed property");

        }

    });
    res.end();
  } else if (what == "addItem") {
      sql = "INSERT INTO FarmItem(Name, IType) VALUES (?, ?)";
      connection.query(sql, [iName, iType],
      function(err, results, fields) {
        console.log(results)
        console.log(err)
        if (err == null) {
          // 1 for success
          res.write("1");
        } else {
          // 0 for failure
          res.write("0");
        }

        res.end();
    });

  } else if (what == "addApprovedItem") {
      console.log("Adding into approved item");
      console.log(iName, iType);
      sql = "INSERT INTO FarmItem(Name, IType, isApproved) VALUES (?, ?, ?)";
      connection.query(sql, [iName, iType, 1],
      function(err, results, fields) {
        console.log(results)
        console.log(err)
        if (err == null) {
          // 1 for success
          res.write("1");
        } else {
          // 0 for failure
          res.write("0");
        }

        res.end();
    });
  }
});

app.post('/manage', function(req, res){
  // Will update information on a property
  //  for property
  // let payload = {
  //  "email": "test2@harvard.edu",
  //  "property": "Test Garden",
  //  "address": "555 Test Road",
  //  "city": "Atlanta",
  //  "zip": "30332",
  //  "acres": 2,
  //  "public": 1,
  //  "commercial": 0,
  //  "items" : [["Pig"], ["Peruvian Lily"]]
  // }

  var email = req.body.email;
  var id = req.body.id;
  var propName = req.body.property;
  var address = req.body.address;
  var acres = req.body.acres;
  var public = req.body.public;
  var commercial = req.body.commercial;
  var items = req.body.items;

  console.log("Trying to insert the following list of items " + items);

  item_arr = []
    // Something needs to be changed about this
    for (i = 0; i < items.length; i++) {
      item_arr[i] = [id, items[i]];
    }

  var sql = "UPDATE Property SET Name = ?, Size = ?, Address = ?, IsPublic = ?, IsCommercial = ?, ApprovedBy = NULL WHERE ID = ?";
  var deletOldItems = "DELETE FROM Grows_Raises WHERE PId = ?";
  var addNewItems = "INSERT INTO Grows_Raises(PId, IName) VALUES (?)";

  connection.query(sql, [propName, acres, address, public, commercial, id],
    function(err, results, fields) {
      //console.log(results)
      console.log(err)
      if (err == null) {
        // After updating property we delete old items
        connection.query(deletOldItems, [id],
        function(err, results, fields) {
          //console.log(results)
          console.log(err)
          if (err == null) {
            //After delete old items we update the list for the property
            for (var i = 0; i < item_arr.length; i++) {
                connection.query(addNewItems, [item_arr[i]],
                function(err, results, fields) {
              //console.log(results)
                    console.log(err)
                    if (err == null) {
                      // 1 for success
                      //res.write("1");
                    } else {
                      //failure
                      //res.write("fail add item");
                    }
                    //res.end();
                });
            }

          } else {
            //failure
            res.write("fall remove item");
            res.end();
          }

        });
      } else {
        // failure
        res.write("fail update property");
        res.end();
      }
    });


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
    var sql = "SELECT User.Email, User.Username, COUNT(Visits.Email) AS Count FROM User LEFT JOIN Visits ON User.Email = Visits.Email WHERE User.UType = ? Group by (User.Email)";
  } else if (type == "owner") {
    // All properties for owned by a user
    type = "Owner";
    var sql = "SELECT User.Username, User.Email, COUNT(User.Email) AS Count FROM User LEFT JOIN Property ON User.Email = Property.OwnedBy WHERE User.UType = ? Group by (User.Email)";
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
  } else if (type == "garden") {
    var sql = "SELECT Name, IType FROM `FarmItem` WHERE (IType = 'Nut' OR IType = 'Fruit') AND isApproved = 1;";
  } else if (type == "orchard") {
    var sql = "SELECT Name, IType FROM `FarmItem` WHERE (IType = 'Vegetable' OR IType = 'Flower') AND isApproved = 1;";
  } else if (type == "unapproved") {
    var sql = "SELECT Name, IType FROM `FarmItem` WHERE isApproved = 0";
  } else if (type == "approved") {
    var sql = "SELECT Name, IType FROM `FarmItem` WHERE isApproved = 1";
  }

  console.log(type + confirmed);
  console.log("Accessing all items with query " + sql);

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


app.post('/visits', function(req, res){
  // Will respond with a list of visits youve made
  // What it need
  // var payload = {
  //  email = "user@mail.com"
  // }

  var email = req.body.email;
  var sql = "SELECT Property.Name AS Name, VDate, AVG(Rating) AS Avg FROM Visits LEFT Join Property ON Property.ID = Visits.PId WHERE Visits.Email = ? Group by (Property.Name)"

  connection.query(sql, [email],
      function(err, results, fields) {
        console.log("Visit Results");
        console.log(results)
        console.log(err)
        if (err == null) {
          // 1 for success
            console.log("=====HERE-----");
          res.write(JSON.stringify(results));
        } else {
          // 0 for failure
          res.write("0");
        }

        res.end();
    });

});

app.post('/approve', function(req, res){
  // Will approve items requested (users, crops, properties, etc)
  // Add properties, users, crops, visits
  //
  // var payload = {
  //  what =  "approveProp" OR "approveItem" OR "approveUser"
  //  id = propId OR item name OR user email
  //  admin = the admin's email
  // }
  var what = req.body.what;
  var id = req.body.id;
  var admin = req.body.admin;
  var sql;

  console.log("approving");

  if (what == "approveProp") {
    sql = "UPDATE Property SET ApprovedBy = ? WHERE ID = ?";
  } else if (what == "approveItem") {
    admin = 1;
    sql = "UPDATE FarmItem SET isApproved = ? WHERE Name = ?";
  }

  connection.query(sql, [admin, id],
      function(err, results, fields) {
        console.log(err)
        if (err == null) {
          // 1 for success
          res.write("1");
        } else {
          // 0 for failure
          res.write("0");
        }

        res.end();
    });

});

app.post('/delete', function(req, res){
  // Will delete information requested by the front end
  // Users, properties, crops, visits
  // var payload = {
  //  what =  "visitorUnlog" OR "adminUnlog" OR "deleteUser" OR "deleteItem" OR "deleteProp"
  //  email = user email
  //  id = property id OR item name
  //  propName = property name for unlogging visit
  // }

  var what = req.body.what;
  var id = req.body.id;
  var email = req.body.email;
  var propName = req.body.propName;
  var sql;
  var values;

  if (what == "visitorUnlog") {
    sql = "DELETE FROM Visits WHERE PId = ? AND Email = ?";
    values = [id, email];
  } else if (what == "adminUnlog") {
    sql = "DELETE FROM Visits WHERE Email = ?";
    values = [email];
  } else if (what == "deleteUser") {
    sql = "DELETE FROM User WHERE Email = ?";
    values = [email];
  } else if (what == "deleteItem") {
    sql = "DELETE FROM FarmItem WHERE Name = ?"
    values = [id];
  } else if (what == "deleteProp") {
    sql = "DELETE FROM Property WHERE ID = ?"
    values = [id];
  } else if (what == "deletePropVisits") {
    sql = "DELETE FROM Visits WHERE PId = ?"
    values = [id];
  }

  connection.query(sql, values,
      function(err, results, fields) {
        console.log(err)
        if (err == null) {
          // 1 for success
          res.write("1");
        } else {
          // 0 for failure
          res.write("0");
        }

        res.end();
    });

});

// ============================================================



// connection.query(
//   'SELECT * FROM `User`;',
//   function(err, results, fields) {
//   console.log(results); // results contains rows returned by server
//   //console.log(fields); // fields contains extra meta data about results, if available
// });