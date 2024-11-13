const mysql = require('mysql');
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 3000;
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("frontend/browser"));
require('dotenv').config({ path: 'dbcredential.env' });



const db = mysql.createConnection({
  host: process.env.DB_HOST,      
  user: process.env.DB_USER,      
  password: process.env.DB_PASSWORD,  
  database: process.env.DB_NAME    
});

db.connect((err)=>
{
    if(err)
    {
        console.error("Not Connected", err)
    }
    else{
        console.log("Connected");
    }
});



app.get("/login", (req, res) => {
  const { username, password } = req.query;

  console.log("username and password", req.query);
  const query = "SELECT USRNAME ,USRPASS FROM usrmst WHERE USRNAME = ? AND USRPASS = ? ";
  db.query(query, [username, password], (err, results) => {
      if (err) {
          console.log("Error executing query", err);
          return res.status(500).send("Server error");
      }

      if (results.length > 0) {
      
          res.json({ message: "Login successful", results});
          console.log("Login successful", results);
      } else {
      
          res.status(401).send("Invalid credentials");
      }
  });
});


app.get('/numset', (req, res) => {
    db.query("SELECT NUM FROM numset WHERE CAT = 'REC'", (err, results) => {
      if (err) {
        console.error('Error fetching num:', err);
        res.status(500).send('Error fetching num');
        return;
      }
      res.json({ NUM: results[0]?.NUM || 1 });
    });
  });


  app.post('/numset/increment', (req, res) => {
  db.query("UPDATE numset SET NUM = NUM + 1 WHERE CAT = 'REC'", (err) => {
    if (err) {
      console.error('Error updating num:', err);
      res.status(500).send('Error updating num');
      return;
    }
    db.query('SELECT NUM FROM numset WHERE ID = 1', (err, results) => {
      if (err) {
        console.error('Error fetching updated num:', err);
        res.status(500).send('Error fetching updated num');
        return;
      }
      res.json({ NUM: results[0]?.NUM || 1 });
    });
  });
});


app.post("/tmpdata", (req, res) => {
  const { RECNO, NAME, MOBILE, ITEM, RATE, PAID,USRNAME } = req.body;


  const checkMobileQuery = 'SELECT SDMOBNO, SDNAME FROM SVdmst WHERE SDMOBNO = ? and SDNAME=?';

  db.query(checkMobileQuery, [MOBILE, NAME], (err, results) => {
    if (err) {
      console.log("Error checking mobile number", err);
      return res.status(500).send("Server error while checking mobile");
    }

    if (results.length === 0) {
      const insertSVdmstQuery = 'INSERT INTO SVDMST (SDMOBNO, SDNAME) VALUES (?, ?)';
      db.query(insertSVdmstQuery, [MOBILE, NAME], (insertErr, insertResult) => {
        if (insertErr) {
          console.log("Error inserting into SVdmst", insertErr);
          return res.status(500).send("Server error while inserting into SVdmst");
        }
        console.log("Mobile and name inserted into SVdmst successfully");
      });
    }

    const insertRECMSTQuery = 'INSERT INTO RECMST (RECNO, NAME, MOBILE, ITEM, RATE, PAID, USRNAME) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(insertRECMSTQuery, [RECNO, NAME, MOBILE, ITEM, RATE, PAID, USRNAME], (recInsertErr, recInsertResult) => {
      if (recInsertErr) {
        console.log("Error executing query", recInsertErr);
        return res.status(500).send("Server error while inserting into RECMST");
      } else {
        return res.json({ message: "Inserted successfully into RECMST" });
      }
    });
  });
});



app.get('/displaytypmdata', (req, res) => {
    

    const query="select RECNO, MOBILE, NAME, ITEM, RATE, PAID, USRNAME FROM RECMST ORDER BY ID";
    db.query(query,(err, result) => {
      if (err) {
        return res.status(500).send("Error occurred while selecting tmpdata");
      }
      res.json(result);
    });
  });
  

  app.put('/updatetmpdata/:edittxtname', (req, res) => {
    const { edittxtname } = req.params;  
    const { RECNO,NAME, MOBILE, ITEM, RATE, PAID  } = req.body;
  

  
   
    const query = 'UPDATE RECMST SET RECNO = ?, NAME = ?, MOBILE = ?, ITEM = ?, RATE = ? , PAID=? WHERE RECNO = ?';
    db.query(query, [RECNO,NAME, MOBILE, ITEM, RATE, PAID, edittxtname], (err, result) => {
      if (err) {
        console.error('Error updating :', err);
        res.status(500).json({ error: 'Failed to update ' });
      } else if (result.affectedRows === 0) {
        res.status(404).json({ error: 'RECORD  not found' });
      } else {
        res.json({ message: ' updated successfully' });
      }
    });
  });
  
  app.delete('/deletetmpdata/:edittxtname', (req, res) => {
    const edittxtname = req.params.edittxtname;
   
    const query = 'DELETE FROM RECMST  WHERE RECNO = ?';
    db.query(query, [edittxtname], (err, result) => {
      if (err) {
        res.status(500).json({ error: 'Failed to delete ' });
      } else if (result.affectedRows === 0) {
        res.status(404).json({ error: ' not found' });
      } else {
        res.json({ message: 'tmpdata deleted successfully' });
      }
    });
  });


 
  app.get('/check-mobile', (req, res) => {
    const mobile = req.query.mobile;
  
    if (!mobile || mobile.length !== 10) {
      return res.status(400).json({ message: 'Invalid mobile number' });
    }
  
    const query = 'SELECT SDNAME FROM SVdmst WHERE SDMOBNO = ?';
    db.query(query, [mobile], (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).json({ message: 'Database query error' });
      }
  
      console.log('Query Results:', results); 
      const names = results.map(row => row.SDNAME);
      return res.json({ SDNAMES: names });
    });
  });
  
  // app.get('/check-mobile', (req, res) => {
  //   const mobile = req.query.mobile;
  
  //   if (!mobile || mobile.length !== 10) {
  //     return res.status(400).json({ message: 'Invalid mobile number' });
  //   }
  
  //   const query = 'SELECT SDNAME FROM SVdmst WHERE SDMOBNO = ?';
  //   db.query(query, [mobile], (err, results) => {
  //     if (err) {
  //       console.error('Error executing query:', err);
  //       return res.status(500).json({ message: 'Database query error' });
  //     }
  
  //     console.log('Query Results:', results); 
  
  //     if (results.length > 0) {
  //       return res.json({ SDNAME: results[0].SDNAME });
  //     } else {
  //       return res.json({ SDNAME: '' });
  //     }
  //   });
  // });
  
  

app.listen(port, ()=>{
    console.log(`Server.js is running on ${port}`);
})

