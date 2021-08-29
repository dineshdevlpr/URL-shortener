const jwt = require('jsonwebtoken')
const { MongoClient, ObjectID } = require('mongodb')

const dbUrl = process.env.DB_URL

async function authorize(req,res,next)
{
        if(req.headers.authorization){
            jwt.verify(req.headers.authorization,process.env.AUTH_KEY, async (err,decoded)=>{
                if(decoded != undefined){
                    if(decoded.user_id == (await getById(decoded.user_id)))
                    {
                        console.log(decoded)
                    next()
                    }else{
                        res.status(401).json({message : "Authorization Failed"})
                    }
                }else{
                    res.status(403).json({message : "Forbidden"})
                }
            })
           
           
        }else{
            res.status(401).json({message:"no token"})
        }

}

async function getById(id){
    try {
        let client = await MongoClient.connect(dbUrl);
        let db = client.db('Url-Shortener');
        let data = await db.collection("users").findOne({ _id : ObjectID(id) })
        let user_id = data._id;
        console.log(user_id)
        return user_id;
    } catch (error) {
        console.log(error) 
    }
}


module.exports = authorize ;