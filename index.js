const express = require('express')
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const authorize = require("./authorize");
const router = require("./userAuth");
const urlShort = require("./urlShort")

const app = express()

const port = process.env.PORT || 4000;
const dbUrl = process.env.DB_URL;

app.use(express.json())
app.use(cors({
    origin : "*",
    credentials : true
}));
app.use("/auth", router)
app.use("/urlshort", urlShort)


app.get("/", authorize, async (req, res) => {
  try {
      let client = await MongoClient.connect(dbUrl);
      let db = client.db("Url-Shortener");
      let data = await db.collection("users").find().toArray();
      if (data) {
          console.log(data)
          res.status(200).json(data)
      } else {
          res.status(404).json({ message: "No Data Found" })
      }
      client.close();
  }
  catch (error) {
      console.log(error)
      res.status(500)
  }
})


app.listen(port, () => {
  console.log(`Server is running on PORT ${port}`)
})
