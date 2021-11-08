const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const admin = require("firebase-admin");
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();


const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


//MidleWare
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wpmdo.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
    if (req.headers.authorization?.startsWith('Bearer ')) {

        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth.verifyToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }
    }
    next();
}
async function run() {
    try {
        await client.connect();
        const database = client.db("doctorsPortal");
        const appointmentsCollection = database.collection("appointment");
        const usersCollection = database.collection("users");


        //GET ALL API  
        app.get('/appointment', async (req, res) => {
            const email = req.query.email;
            const date = new Date(req.query.date).toLocaleDateString();
            const query = { email: email, date: date };
            const appointment = await appointmentsCollection.find(query).toArray();
            res.json(appointment);
        })
        //POST API 
        app.post('/appointment', async (req, res) => {
            const appointment = req.body;
            const result = await appointmentsCollection.insertOne(appointment)
            // console.log(result);
            res.json(result);
        });

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        //USERS POST API
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        //Make Admin UPDATe API
        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            const requester = (req.decodedEmail);
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            } else {
                res.status(403).json({ message: 'you do not have permission to access' })
            }


        })


    } finally {
        // await client.close();
    }
}
run().catch(console.dir)


app.get('/', (req, res) => {
    res.send('Doctors Portal Server');
});

app.listen(port, (req, res) => {
    console.log('Server Running at port', port);
});