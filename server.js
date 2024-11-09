const mysql = require('mysql');
const express = require('express');
const cors = require('cors');
const port = 3000;
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("frontend/browser"));

const db = mysql.createConnection(
    {
        host:"localhost",
        user:"root",
        password:"",
        database: "2024-kurindu"
    }
);

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
    const { RECNO,NAME, MOBILE, ITEM, RATE, PAID } = req.body;
    const query = "INSERT INTO RECMST ( RECNO,NAME, MOBILE, ITEM, RATE, PAID  ) VALUES (?, ?, ?, ?,?,?)";
    
    db.query(query, [RECNO,NAME, MOBILE, ITEM, RATE, PAID ], (err, result) => {
        if (err) {
            console.log("Error executing query", err);
            return res.status(500).send("Server error");
        } else {
            res.json({ message: "send" });
        }
    });
});



app.get('/displaytypmdata', (req, res) => {
    

    const query="select RECNO, MOBILE, NAME, ITEM, RATE, PAID FROM RECMST ORDER BY ID";
    db.query(query,(err, result) => {
      if (err) {
        return res.status(500).send("Error occurred while selecting name");
      }
      res.json(result);
    });
  });
  

  app.put('/updatetmpdata/:edittxtname', (req, res) => {
    const { edittxtname } = req.params;  
    const { RECNO,NAME, MOBILE, ITEM, RATE, PAID  } = req.body;
  
    // console.log('Updating RECORD  with STCODE:',edittxtname );
    // console.log('Update data:', {RECNO,NAME, MOBILE, ITEM, RATE, PAID});
  
   
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
        res.json({ message: 'Student deleted successfully' });
      }
    });
  });

app.listen(port, ()=>{
    console.log(`Server.js is running on ${port}`);
})

