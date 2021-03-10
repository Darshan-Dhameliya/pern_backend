const express = require("express");
const pool = require("./db");
const app = express();
const redis = require("redis");
const port = 3020;
const fileUpload = require("express-fileupload");
var nodemailer = require("nodemailer");
var cors = require("cors");
const Redis_port = 6379;
const client = redis.createClient(Redis_port);
app.use(fileUpload());
app.use(cors());
app.use(express.json());
app.listen(port);

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "login123signup123@gmail.com",
    pass: "Darshan@20",
  },
});

app.post("/getData", async (req, res) => {
  const { email, password } = req.body;
  const getrows = await pool.query(
    "SELECT * FROM userdata where email=$1 or username=$2",
    [email, email]
  );
  if (getrows.rowCount) {
    if (getrows.rows[0].password === password) {
      res.json(getrows.rows[0].id);
    } else {
      res.json("plese enter correct password");
    }
  } else {
    res.json("please sign up");
  }
});

function insertdata(req, res, next) {
  const { username, email, password, cotp, user_image } = req.body;
  client.get(email, (err, data) => {
    if (data !== null) {
      if (data == cotp) {
        client.del(email);
        const insertdata = pool.query(
          "insert into userdata(email,password,username,image)values($1,$2,$3,$4)",
          [email, password, username, user_image]
        );
        if (insertdata) {
          res.json("succesful sign up");
        } else {
          res.json("something went wrong please try again");
        }
      } else {
        res.json("please enter right otp");
      }
    } else {
      next();
    }
  });
}

app.post("/sendData", insertdata, async (req, res) => {
  const { email, username } = req.body;
  const serchemail = await pool.query(
    "SELECT id FROM userdata where email=$1",
    [email]
  );
  const serchusername = await pool.query(
    "SELECT id FROM userdata where username=$1",
    [username]
  );
  if (serchusername.rowCount) {
    res.json("This username is already exists.Try differnt username");
  } else if (serchemail.rowCount) {
    res.json("This email already exists.Try differnt email");
  } else {
    res.json("SEND_EMAIL");
    var otp = Math.floor(1000 + Math.random() * 9000);
    var mailOptions = {
      from: "login123signup123@gmail.com",
      to: email,
      subject: "Sending Email using Node.js",
      html: `<h1>${otp}</h1>`,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
        client.setex(email, 300, otp);
      }
    });
  }
});

function changepass(req, res, next) {
  const { password, cotp, email } = req.body;

  client.get(email, (err, data) => {
    if (data !== null) {
      if (data == cotp) {
        client.del(email);
        const updatedata = pool.query(
          "UPDATE userdata SET password=$1 WHERE username=$2 or email=$3",
          [password, email, email]
        );
        if (updatedata) {
          res.json("succesful Update Password");
        } else {
          res.json("something went wrong please try again");
        }
      } else {
        res.json("please enter right otp");
      }
    } else {
      next();
    }
  });
}

app.post("/forget", changepass, async (req, res) => {
  const { email } = req.body;
  const serchemail = await pool.query(
    "SELECT email FROM userdata where email=$1 or username=$2",
    [email, email]
  );
  if (serchemail.rowCount) {
    res.json("please chek your mail we send email");
    var otp = Math.floor(1000 + Math.random() * 9000);
    var mailOptions = {
      from: "login123signup123@gmail.com",
      to: serchemail.rows[0].email,
      subject: "Sending Email using Node.js",
      html: `<h1>${otp}</h1>`,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
        client.setex(email, 120, otp);
      }
    });
  } else {
    res.json("you are not connected with us.Please Sign Up now");
  }
});

app.post("/updateusername", async (req, res) => {
  const { username, id } = req.body;
  const selectuser = await pool.query(
    "select id from userdata where username=$1",
    [username]
  );
  if (selectuser.rowCount) {
    res.json("username alredy exists");
  } else {
    const updateuser = pool.query(
      "UPDATE userdata SET username=$1 WHERE id=$2",
      [username, id]
    );
    res.json("succesful update");
  }
});

app.post("/deleteac", async (req, res) => {
  const { id, password } = req.body;
  const selectuser = await pool.query(
    "select password from userdata where id=$1",
    [id]
  );
  if (selectuser.rowCount) {
    if (selectuser.rows[0].password === password) {
      pool.query("DELETE FROM userdata WHERE id=$1", [id]);
      res.json("succesful Delete your a/c");
    } else {
      res.json("Please Enter Correct password");
    }
  }
});

app.get("/getdetails/:id", async (req, res) => {
  const id = req.params.id;
  const selectuser = await pool.query(
    "select username,image from userdata where id=$1",
    [id]
  );
  if (selectuser.rowCount) {
    res.json(selectuser.rows[0]);
  }
});

app.post("/changepass/:id", async (req, res) => {
  const { password, newpassword } = req.body;
  const id = req.params.id;
  const selectuser = await pool.query(
    "select password from userdata where id=$1",
    [id]
  );
  if (selectuser.rowCount) {
    if (selectuser.rows[0].password === password) {
      if (password === newpassword) {
        res.json("try difference password");
      } else {
        pool.query("UPDATE userdata SET password=$1 WHERE id=$2", [
          newpassword,
          id,
        ]);
        res.json("succesful Update Password");
      }
    } else {
      res.json("your password is wrong");
    }
  }
});

app.post("/changephoto", async (req, res) => {
  const { id, imageurl } = req.body;
  pool.query("UPDATE userdata SET image=$1 WHERE id=$2", [imageurl, id]);
  console.log(id, imageurl);
  res.json(null);
});
