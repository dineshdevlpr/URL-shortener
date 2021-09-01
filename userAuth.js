const router = require("express").Router();
const { MongoClient, ObjectID } = require("mongodb");
const bcrypt = require("bcrypt");
const nodeMailer = require("nodemailer");
var jwt = require('jsonwebtoken')
var randomstring = require("randomstring");
require("dotenv").config();

const dbUrl = process.env.DB_URL;
const feUrl = process.env.FE_URL;
const randomString = randomstring.generate();

router.post("/register", async (req, res) => {
    try {
      let client = await MongoClient.connect(dbUrl);
      let db = client.db("Url-Shortener");
      let data = await db.collection("users").findOne({ email: req.body.email });
  
      if (!data) {
        let hashedPassword = await bcrypt.hash(req.body.password, 10);
        req.body.password = hashedPassword;
        let regToken = jwt.sign({email: req.body.email},process.env.REG_SECRET_KEY);
            await db.collection("users").insertOne({ firstname:req.body.firstname, lastname:req.body.lastname, email:req.body.email, password:req.body.password, active:false, regToken:regToken});
            let mailTransporter = nodeMailer.createTransport({
              host: "smtp-mail.outlook.com",
              port: 587,
              secure: false,
              tls: {
                rejectUnauthorized: false,
              },
              auth: {
                user: "dineshdevlpr@outlook.com",
                pass: process.env.PASS
                  },
              });
            let mailDetails = await mailTransporter.sendMail({
                from: '"DINESH"<dineshdevlpr@outlook.com>',
                to: req.body.email,
                subject: "Account Activation link",
                html: `<div>
                    <h3>Thanks for Registering.. Click on the below link to activate your account :)</h3>
                    <a href="${feUrl+"auth/activation/"+regToken}">Activate Account</a>
                  </div>`,
              });
              console.log(mailDetails);
            res.status(200).send("Check your registered mail for activation link");
        
      } else {
        res.status(400).json({
          message: `User With ${req.body.email} Already Exists. Try Using Login Option`,
        });
      }
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  });


  router.put("/activation/:token", async(req,res)=>{
    try{
        let client = await MongoClient.connect(dbUrl);
        let db = client.db("Url-Shortener");
        let data = await db.collection("users").findOne({ regToken:req.params.token });
        if(data){
            await db.collection("users").updateOne({ regToken:req.params.token },{ $unset : { regToken:1 }, $set : { active:true }});
            res.status(200).send("Account Successfully Activated");
        }
        else
        res.status(404).send("Invalid Request");
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
});


  
    router.post("/login", async (req, res) => { 
    try {
      let client = await MongoClient.connect(dbUrl);
      let db = client.db("Url-Shortener");
      let data = await db.collection("users").findOne({ email: req.body.email });
      if (data) {
        if (data.active===true) {
          let isValid = await bcrypt.compare(req.body.password, data.password);
          if (isValid) {
            let authToken = jwt.sign({user_id:data._id},process.env.AUTH_KEY)
            res.status(200).json({
              message: "Successfully Logged In", authToken
            });
          } else {
            res.status(401).json({
              message: "Invalid Password",
            });
          }
        } else {
          res.status(400).json({
              message : `${req.body.email} is not yet activated. Check Your mail to activate`
          });
        }
      }
      else {
        res.status(400).json({
          message: `${req.body.email} not yet Registered`,
        });
      }
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  });

  router.post("/forgot", async (req, res) => {
    try {
      let client = await MongoClient.connect(dbUrl);
      let db = client.db("Url-Shortener");
      let data = await db
        .collection("users")
        .findOne({ email: req.body.email });
      if (data) {
  
        await db
          .collection("users")
          .findOneAndUpdate(
            { email: req.body.email },
            { $set: { randomString : randomString } }
          );
        
  
        let mailTransporter = nodeMailer.createTransport({
          host: "smtp-mail.outlook.com",
          port: 587,
          secure: false,
          tls: {
            rejectUnauthorized: false,
          },
          auth: {
            user: "dineshdevlpr@outlook.com",
            pass: process.env.PASS
          }
        });
  
     
         let mailDetails = await mailTransporter.sendMail({
          from: '"DINESH"<dineshdevlpr@outlook.com>',
          to: req.body.email,
          subject: "Password Reset",
          html: `<div>
                    <h3>If You have requested for Password Reset, Click the following link to reset your password.If not requested, then just ignore this mail</h3>
                    <a href="${feUrl+"auth/reset/"+randomString}">RESET PASSWORD</a>
                  </div>`,
        })   
        console.log(mailDetails)
        res.status(200).json({
          message:
            "Password Reset Link has been sent to your mail",
        });
      } else {
        res.status(404).json({
          message: "User not found",
        });
      }
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  });
  
  router.post("/reset/:randomString", async (req, res) => {
    try {
      const client = await MongoClient.connect(dbUrl, {
        useUnifiedTopology: true,
      });
      const db = client.db("Url-Shortener");
      const userData = await db.collection("users").findOne({
        randomString: req.params.randomString
      });
      if (userData) {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const updated = await db
          .collection("users")
          .updateOne(
            { randomString: req.params.randomString },
            { $set: { password: hashedPassword } }
          );
        if (updated) {
          await db
            .collection("users")
            .updateOne(
              { randomString: req.params.randomString },
              { $unset: { randomString : 1} }
            );
  
          res.status(200).json({
            message: "Password Successfully updated",
          });
        }
      } else {
        res.status(404).json({
          message: "Error Password can't be updated",
        });
      }
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  });

  module.exports = router;