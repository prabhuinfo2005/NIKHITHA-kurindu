const mysql = require('mysql');
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 3000;
const app = express();
const path = require('path');
const fs = require('fs');
app.use(express.json());
const multer = require('multer');
const nodemailer = require('nodemailer'); 
app.use(cors());
app.use(express.static("frontend/browser"));
require('dotenv').config({ path: 'emailpass.env' });
require('dotenv').config({ path: '.env' });

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const razorpay = new Razorpay({
  key_id: 'rzp_test_7Kb0hiKFcOOs4W',
  key_secret: 'BlrUqSwYfkl5yqoeqjHTTcuL',
});

const readData = () => {
  if (fs.existsSync('orders.json')) {
    const data = fs.readFileSync('orders.json');
    return JSON.parse(data);
  }
  return [];
};


const writeData = (data) => {
  fs.writeFileSync('orders.json', JSON.stringify(data, null, 2));
};


if (!fs.existsSync('orders.json')) {
  writeData([]);
}



app.post('/create-order', async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;

    const options = {
      amount: amount * 100, 
      currency,
      receipt,
      notes,
    };


    const order = await razorpay.orders.create(options);
    

    const orders = readData();
    orders.push({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: 'created',
    });
    writeData(orders);


    res.json(order); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating order');
  }
});






app.post('/verify-payment', async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    selectedRecordIds,
    records, 
    SDNAME,
    SDMOBILE,
    SDEMAIL,
    SDADDR,
    SDPINCODE,
     SDAREA,
     SDSTATE,
    SDCITY,
  } = req.body;

  const secret = razorpay.key_secret;
  const body = razorpay_order_id + '|' + razorpay_payment_id;

  try {
    const isValidSignature = validateWebhookSignature(body, razorpay_signature, secret);

    if (isValidSignature) {
      const orders = readData();
      const order = orders.find((o) => o.order_id === razorpay_order_id);

      if (order) {
        order.status = 'paid';
        order.payment_id = razorpay_payment_id;

        writeData(orders);

       
        records.forEach((record) => {
          const query = `
            INSERT INTO rectmp2 (
              SDNAME, SDMOBILE, SDEMAIL, SDADDR, SDPINCODE, SDAREA, SDCITY, SDSTATE,
              SEVANAME, QTY, HSRATE, SDDATE, AMT, PPAYID, PORDERID, PSTATUS
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
          `;

          const values = [
            SDNAME,
         SDMOBILE,
          SDEMAIL,
           SDADDR,
         SDPINCODE,
            SDAREA,
            SDCITY,
            SDSTATE,
            record.SEVANAME,
            record.QTY,
            record.HSRATE,
            record.SDDATE,
            record.AMT,
            razorpay_payment_id,
            razorpay_order_id,
            'paid',
          ];

          db.query(query, values, (err, result) => {
            if (err) {
              console.error('Error inserting into rectmp2:', err);
              return res.status(500).json({ status: 'error', message: 'Database insertion failed' });
            }
            console.log('rectmp2 updated with payment details:', result);
          });
        });

        return res.status(200).json({ status: 'success' });
      } else {
        console.warn('Order not found:', razorpay_order_id);
        return res.status(404).json({ status: 'order_not_found', message: 'Order not found in records' });
      }
    } else {
      console.warn('Payment verification failed for order:', razorpay_order_id);
      return res.status(400).json({ status: 'verification_failed', message: 'Payment signature verification failed' });
    }
  } catch (error) {
    console.error('Error during payment verification process:', error);
    return res.status(500).json({ status: 'error', message: 'Error verifying payment' });
  }
});



const db = mysql.createPool({
  connectionLimit: 10,  // Max number of simultaneous connections
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});


const checkDbConnection = (callback) => {
 
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Error while checking connection: ", err);
   
      return callback(true);
    }
    connection.ping((pingErr) => {
      if (pingErr) {
        console.error("MySQL connection is lost. Reconnecting...");
        return callback(true);
      } else {
        console.log("MySQL connection is healthy.");
        connection.release(); 
        return callback(false);
      }
    });
  });
};


app.use((req, res, next) => {
  checkDbConnection((connectionLost) => {
    if (connectionLost) {
      console.log("Reconnecting to the database...");
  
      return res.status(500).send("Database connection lost. Please try again later.");
    }
    next();  
  });
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
  const { RECNO, NAME, MOBILE, ITEM, RATE, PAID,USRNAME, UPI} = req.body;

 
    const insertRECMSTQuery = 'INSERT INTO RECMST (RECNO, NAME, MOBILE, ITEM, RATE, PAID, USRNAME, UPI) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(insertRECMSTQuery, [RECNO, NAME, MOBILE, ITEM, RATE, PAID, USRNAME, UPI], (recInsertErr, recInsertResult) => {
      if (recInsertErr) {
        console.log("Error executing query", recInsertErr);
        return res.status(500).send("Server error while inserting into RECMST");
      } else {
        return res.json({ message: "Inserted successfully into RECMST" });
      }
    });

});


app.get('/displaytypmdata', (req, res) => {
    

    const query="select RECNO, MOBILE, NAME, ITEM, RATE, PAID, USRNAME, UPI FROM RECMST ORDER BY ID";
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



  
  app.put('/updatetmpdataunpaid', (req, res) => {
    const { selectedRecords, PAID, UPI } = req.body;
  
    if (!selectedRecords || selectedRecords.length === 0) {
      return res.status(400).json({ error: 'No records selected' });
    }
  

    const query = 'UPDATE RECMST SET PAID = ?, UPI=?  WHERE RECNO IN (?)';
    
   
    db.query(query, [PAID,  UPI, selectedRecords], (err, result) => {
      if (err) {
        console.error('Error updating:', err);
        res.status(500).json({ error: 'Failed to update records' });
      } else if (result.affectedRows === 0) {
        res.status(404).json({ error: 'No records found for update' });
      } else {
        res.json({ message: `${result.affectedRows} records updated successfully` });
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
    const query = 'SELECT DISTINCT NAME FROM RECMST ORDER BY NAME ';
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).json({ message: 'Database query error' });
      }
  
      console.log('Query Results:', results);
      return res.json({ results });
    });
  });
  


  app.get('/displayfirm', (req, res) => {
    const query = 'SELECT FIRMNAME, FIMAGE FROM FIRMMST ';
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).json({ message: 'Database query error' });
      }
      const products = results.map(product => {
        if (product.FIMAGE) {
          
            const base64Image = Buffer.from(product.FIMAGE).toString('base64');
            product.imageSrc = `data:image/jpeg;base64,${base64Image}`; 
        }
       
        return product;
    });

    res.json(products);
});
});



app.get('/sevanames', (req, res) => {
  const query = 'SELECT DISTINCT PSNAME , HSRATE FROM SEVMST ORDER BY ID ';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ message: 'Database query error' });
    }

    console.log('Query Results:', results);
    return res.json( {results} );
  });
});




app.post("/insertsevadetails", (req, res) => {
  const {SDNAME, SDMOBILE, SDEMAIL, SDADDR, SDPINCODE, SDAREA, SDCITY, SDSTATE, SEVANAME, QTY, HSRATE,SDDATE, AMT} = req.body;

 
    const insertRECMSTQuery = 'INSERT INTO RECTMP2 ( SDNAME, SDMOBILE, SDEMAIL, SDADDR, SDPINCODE, SDAREA, SDCITY, SDSTATE, SEVANAME, QTY, HSRATE,SDDATE,  AMT) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?)';
    db.query(insertRECMSTQuery, [ SDNAME, SDMOBILE, SDEMAIL, SDADDR, SDPINCODE, SDAREA, SDCITY, SDSTATE,SEVANAME, QTY, HSRATE,SDDATE,  AMT], (err, results) => {
      if (err) {
        console.log("Error executing query", err);
        return res.status(500).send("Server error while inserting into RECTMP2");
      } else {
        return res.json({ message: "Inserted successfully into RECTMP2" });
      }
    });

});



app.get('/displaysevadetails', (req, res) => {
  const query = `
    SELECT ID, SEVANAME, HSRATE, QTY, SDDATE, AMT 
    FROM RECTMP2 
    WHERE PSTATUS != "paid" OR PSTATUS IS NULL OR PSTATUS = '' 
    ORDER BY ID;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ message: 'Database query error' });
    }

    return res.json(results);
  });
});



app.get('/displaysevadetails1/:orderId', (req, res) => {
  const orderId = req.params.orderId;


  db.query("SELECT SEVANAME, HSRATE, QTY, SDDATE, AMT FROM RECTMP2 WHERE PORDERID = ?", [orderId], (err, result) => {
    if (err) {
      res.status(500).json({ message: "Error fetching data" });
    } else {
      res.status(200).json(result);  
    }
  });
});





app.delete('/deletealldata', (req, res) => {
 
 
  const query = 'DELETE FROM RECTMP2 ';
  db.query(query, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Failed to delete ' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ error: ' not found' });
    } else {
      res.json({ message: 'DATA deleted successfully' });
    }
  });
});

app.delete('/deletesevadetail/:edittxtname', (req, res) => {
  const edittxtname = req.params.edittxtname;
 
  const query = 'DELETE FROM RECTMP2  WHERE ID = ?';
  db.query(query, [edittxtname], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Failed to delete ' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ error: ' not found' });
    } else {
      res.json({ message: 'SEVA DETAILS deleted successfully' });
    }
  });
});







app.put('/updatebillingdata/:edittxtname', (req, res) => {
    const edittxtname = req.params.edittxtname;
  const { SEVANAME, QTY, HSRATE,DATE, AMT} = req.body;

  const query = 'UPDATE RECTMP2 SET SEVANAME=?, QTY=?, HSRATE=?,DATE=?,  AMT=? WHERE ID = ?';
  
 
  db.query(query, [ SEVANAME, QTY, HSRATE,DATE, AMT,edittxtname], (err, result) => {
    if (err) {
      console.error('Error updating:', err);
      res.status(500).json({ error: 'Failed to update records' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ error: 'No records found for update' });
    } else {
      res.json({ message: `${result.affectedRows} records updated successfully` });
    }
  });
});



app.post('/send-verification', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).send({ message: 'Email is required.' });
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000); 

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD
  }

 
  });

 
  const mailOptions = {
    from: process.env.EMAIL,

    to: email,
    subject: 'Your Verification Code',
    text: `Your verification code is: ${verificationCode}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send({ message: 'Verification code sent!', code: verificationCode });
  } catch (error) {
    res.status(500).send({ message: 'Error sending email.', error });
  }
});





app.post("/addsignup", (req, res) => {
  const { NAME, MOBNO, EMAIL,ADDR,PINCODE, AREA, STATE, CITY, PASS} = req.body;

 
    const query = 'INSERT INTO SVDMST (NAME, MOBNO, EMAIL,ADDR, PINCODE, AREA, STATE, CITY,PASS) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [NAME, MOBNO, EMAIL,ADDR,PINCODE, AREA, STATE, CITY, PASS], (err, result) => {
      if (err) {
        console.log("Error executing query", err);
        return res.status(500).send("Server error while inserting");
      } else {
        return res.json({ message: "Inserted successfully " });
      }
    });

});


app.get("/displayemail", (req, res) => {


 
    const query = 'SELECT EMAIL, PASS FROM SVDMST';
    db.query(query, (err, result) => {
      if (err) {
        console.log("Error executing query", err);
        return res.status(500).send("Server error while FETCHED");
      } else {
        return res.json((result));
      }
    });

});

app.post("/signin", (req, res) => {
  const { username, password } = req.body;

  console.log("username and password", req.query);
  const query = "SELECT EMAIL ,PASS FROM svdmst WHERE EMAIL = ? AND PASS = ? ";
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




app.get('/getUserDetails', (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const query = `
    SELECT NAME, MOBNO, EMAIL, ADDR, PINCODE, AREA, STATE, CITY
    FROM svdmst 
    WHERE EMAIL = ?
  `;

  db.query(query, [email], (err, results) => {
    if (err) {
      console.error("Error executing query", err);
      return res.status(500).json({ error: "Server error" });
    }

    if (results.length > 0) {
      const user = results[0];
      res.json({
        NAME: user.NAME,
        MOBNO: user.MOBNO,
        EMAIL: user.EMAIL,
        ADDR: user.ADDR,
        PINCODE: user.PINCODE,
        AREA: user.AREA,
        STATE: user.STATE,
        CITY: user.CITY,
      });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });
});


app.post('/send-resetverification', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).send({ message: 'Email is required.' });
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000); 

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD
  }

 
  });

 
  const mailOptions = {
    from: process.env.EMAIL,

    to: email,
    subject: 'Your Verification Code for password Reset',
    text: `Your verification code is for password reset is: ${verificationCode}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send({ message: 'Verification code sent!', code: verificationCode });
  } catch (error) {
    res.status(500).send({ message: 'Error sending email.', error });
  }
});




app.post('/send-email', upload.single('file'), async (req, res) => {
  const { email, payment2Content } = req.body;
  const file = req.file;

  if (!email) {
    return res.status(400).send({ message: 'Email is required.' });
  }

  if (!file) {
    return res.status(400).send({ message: 'PDF file is required.' });
  }

  // Basic CSS styling for the email content
  const cssStyles = `
    <style>
   .payment-success {
    max-width: 620px;
    margin: 50px auto;
    padding: 30px 20px;
    background-color: #f0fff4;
    border: 2px solid #4caf50;
    border-radius: 8px;
    text-align: center;
    font-family: 'Arial', sans-serif;
   
  }
  
  .payment-success h1 {
    color: #035658;
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 20px;
  }
  
  .payment-success p {
    font-size: 1.1rem;
    color: #036b62;
    margin: 10px 0;
    line-height: 1.5;
  }
  
  .payment-success p strong {
    color: #12887e;
  }
  
  .payment-success {
    animation: fadeIn 0.8s ease-in-out;
  }
  
 



  .container.main1
{
    max-width: 750px;
    margin: 0 auto;
    padding: 20px;
    border: 3px solid #0f0101;

    /* background: linear-gradient(135deg, rgb(140, 238, 213), rgb(167, 231, 223),rgb(173, 245, 250));  */
    background-color:#9cf5ed;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}


.form-group {
    margin-bottom: 15px;
}

.col-form-label {

    width: 100%; 
    font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;
   color: black;

   font-size: 19px;
}

.button-container {
    text-align: center;
    margin-top: 20px;
  }
  
  
  .button-container button {
    margin: 5px;
    padding: 10px 20px;
    font-size: 13px;
    cursor: pointer;
   

  }
  
  button[color="primary"] {
    /* background: linear-gradient(135deg, #074c85, #070116);  */
    background-color:#074c85;
    color: #fff;
    border: none;
    font-weight: bold;
    border-radius: 15px;
  }

  button[color="danger"] {
    background: linear-gradient(135deg, #850742, #f52261); 
    color: #fff;
    border: none;
    font-weight: bold;
   
  }
  .smallbutton{
    width: 107px;
  }

  .smallbutton2{
    width: 50px;
    font-size: 10px;
    
  }

  button:hover {
    opacity: 0.9;
  }
  button{
    
    align-items: center;
  }
  table {
 
width: 100%;
    border-collapse: collapse;
    margin-top: 0;
    margin-left: auto;
    margin-right: auto;

    display: block;
    max-width: 600%;
    overflow-y: auto;
    max-height: 330px;
 
    cursor: pointer;
    border-radius: 2px;
  }
 

 .name{
  width: 10px;
 }

 .name1{

  text-align: center;
  padding: 4px;

 }
  
 .name2{

  text-align: center;
  padding: 0;
  font-size: 10px;
 }
   
 .name3{

  text-align: left;
  padding: 5px;
  font-size: 10px;
 }
 .rate2{
  font-size: 10px;
padding: 15px;
text-align: center;
 }


 .rate3{
  font-size: 10px;
padding: 5px;
 }
 
 .rate6{
  font-size: 10px;
padding: 1px;
 }
 .rate5{

padding: 1px;
 }

 .table2{
font-size: 40px;
font-size: 10px;
 }


  thead {
    position: sticky;
    top: 0;
    z-index: 2;
  }
  h3{
   
    font-family: 'Arial', sans-serif;
    font-weight: 600;

    
    color: #412e0a;
  }
  td{
    color: black;
  }
.usrname{
  width: 20px;
}
  table, th, td {
    border: 1px solid #110505;
  }
 th{
  width: 300px;

 }
.paid{
  width: 10px;
}

.rate{
padding: 20px;
}

.recno{
  width: 10%;
}
  th, td {
    padding: 10px 30px;
    text-align: center;
  }
  
  td{
    background-color: white;
  }
  th {
    /* background: linear-gradient(135deg, #80f0e6, #70f0f0);  */
    background-color: rgb(80, 206, 195);
    font-weight:bold;
    font-size: 19px;
  }


  .head1{
    background-color: #123091;
  }
  .selected {
   
    background-color: #ece795;
  
  }

  .table-scroll {
    overflow-y: auto;
    max-height: 00px; 
  }

.custom-checkbox {
    transform: scale(1.5); 
    margin-top: 8px; 
    width: 20px;
    height: 15px;
  }
  



  .hii{
    width: 20px;
  }
  .h2 {


 

    
  
    
}


hr {
  border: 0; 
  height: 2px; 
  background: linear-gradient(to right, #2c2c2c, #1a1a1a); /* Darker gradient colors */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3); 
}


  .pclass{
   font-size: 21px;
   color: #0c7291;
   font-weight: bold;
   justify-content: center;
   align-items: center;
   text-align: center;
  }




.dropbtn {
  background-color: #04AA6D;
  color: white;
  padding: 16px;
  font-size: 16px;
  border: none;
  cursor: pointer;
}


.dropbtn:hover, .dropbtn:focus {
  background-color: #3e8e41;
}


#myInput {
  box-sizing: border-box;

  background-position: 14px 12px;
  background-repeat: no-repeat;
  font-size: 16px;
  padding: 14px 20px 12px 45px;
  border: none;
  border-bottom: 1px solid #ddd;
}


#myInput:focus {outline: 3px solid #ddd;}

.bigbutton{
  width: 50%;
}



.dropdown-content {
  display: none;
  position: absolute;
  background-color: #f5eded;
  min-width: 100%;
  border: 1px solid #ddd;
  z-index: 1;
}


.dropdown-content p {

  color: black;
 padding: 1px 10px;
margin-bottom: 2px;
  text-decoration: none;

  cursor: pointer;
}


.dropdown-content.show {
  display: block; 
}

.total{
  color: red;
  font-size: 20px;

}

.total2{
  color: red;
  font-weight: bold;
  font-size: 20px;

}



    </style>
  `;

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'Your Payment Details PDF',
    html: `
      ${cssStyles}
      <p>Please find attached the PDF containing your payment details.</p>
      <div>${payment2Content}</div>
    `,
    attachments: [
      {
        filename: 'MYPdf.pdf',
        content: file.buffer,
        contentType: 'application/pdf',
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send({ message: 'Error sending email.', error });
  }
});


app.post("/reset-password", (req, res) => {
  const { email, confirmpassword } = req.body; 


  if (!email || !confirmpassword) {
    return res.status(400).send("Email and password are required");
  }
  const query = "SELECT EMAIL FROM svdmst WHERE EMAIL = ? "; 
  db.query(query, [email], (err, results) => {
      if (err) {
          console.log("Error executing query", err);
          return res.status(500).send("Server error");
      }

      if (results.length > 0) {
      
          const updateQuery = "UPDATE svdmst SET PASS = ? WHERE EMAIL = ?"; 
          db.query(updateQuery, [confirmpassword, email], (err, updateResults) => {
              if (err) {
                  console.log("Error updating password", err);
                  return res.status(500).send("Server error");
              }
              res.json({ message: "Password updated successfully" });
          });
      } else {
          res.status(401).send("");
      }
  });
});




app.post("/change-password", (req, res) => {
  const { email, oldPassword, newPassword } = req.body; 
  console.log("email old password and new password is", req.body);


  const query = "SELECT EMAIL, PASS FROM SVDMST WHERE EMAIL = ? AND PASS = ?"; 
  db.query(query, [email, oldPassword], (err, results) => {
      if (err) {
          console.log("Error executing query", err);
          return res.status(500).send("Server error");
      }
console.log("selected email and password is ", email, oldPassword);
      if (results.length > 0) {
      
        const updateQuery = "UPDATE SVDMST SET PASS = ? WHERE EMAIL = ? AND PASS = ?";
          db.query(updateQuery, [newPassword, email,oldPassword], (err, updateResults) => {
              if (err) {
                  console.log("Error updating password", err);
                  return res.status(500).send("Server error");
              }
              res.json({ message: "Password updated successfully" });
          });
      } else {
          res.status(401).send("Old password is incorrect");
      }
  });
});




app.listen(port, ()=>{
    console.log(`Server.js is running on ${port}`);
})

