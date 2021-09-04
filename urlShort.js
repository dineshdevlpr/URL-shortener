const router = require("express").Router();
const { MongoClient, ObjectID } = require("mongodb");
var validUrl = require('valid-url');
const shortid = require('shortid');
require("dotenv").config();
const authorize = require("./authorize");


const dbUrl = process.env.DB_URL;

// create shortid using shortid npm package

router.post('/createurl', authorize, async (req, res) => {

    try {
        let client = await MongoClient.connect(dbUrl);
        let db = client.db("Url-Shortener");
        let longUrl = req.body.longUrl;
        if (validUrl.isUri(longUrl)) {

            let shortUrlId = shortid.generate();
            let date = await db.collection("urls").insertOne({ longUrl : req.body.longUrl, shortUrlId : shortUrlId , date : new Date().toLocaleDateString()});
            res.status("200").json({ message: "Url shortening successfull" })
        } else {
            res.status("401").json({ message: "Invalid URL" })
        }
        client.close();
    } catch (error) {
        console.log(error)
        res.status(500)
    }
})

// list of data created

router.get('/listurldata', authorize, async (req, res) => {
    try {
        let client = await MongoClient.connect(dbUrl);
        let db = client.db("Url-Shortener");
        let data = await db.collection("urls").find().toArray();
        if (data) {
            res.status(200).json(data);
        } else {
            res.status(404).json({ message: "No Data Found" })
        }
        client.close();
    } catch (error) {
        console.log(error)
        res.status(500)
    }

})

// total number of urls created on selected date

router.get('/countbydate', authorize, async(req,res)=>{
    try {
        let client = await MongoClient.connect(dbUrl);
        let db = client.db('Url-Shortener');
        let data = await db.collection("urls").find({date:req.body.date}).toArray();
        if(data)
        {
            let urlCount = data.length;
            res.status(200).json({message: `${urlCount} url created on ${req.body.date}`, data });
        }else {
            res.status(404).json({ message: "No data created on selected date" })
        }
        client.close();
    } catch (error) {
        console.log(error)
        res.status(500)
    }
})


// redirect to actual Url

router.get('/:shortUrlId', async (req, res) => {
    try {
        let client = await MongoClient.connect(dbUrl);
        let db = client.db("Url-Shortener");
        let data = await db.collection("urls").findOne({ shortUrlId : req.params.shortUrlId })
            if(data){
                res.redirect(data.longUrl)
                res.status(200).json({message:"Redirected to Actual Url",data})
            }
            else {
                res.status(404).json({ message: "No Data Found" })
            }  
            client.close();
    } catch (error) {
        console.log(error)
        res.status(500)
    }

})


module.exports = router;