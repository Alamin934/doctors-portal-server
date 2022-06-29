const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;


//MiddleWare
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ogrrwih.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {

    try {
        await client.connect();

        const database = client.db('doctors_portal');
        const appointmentsCollection = database.collection('appointments');

        //Appointments POST method
        app.post('/appointments', async (req, res) => {
            const appointment = req.body;
            const result = await appointmentsCollection.insertOne(appointment);
            res.json(result)
        });


    }
    finally {
        // await client.close();
    }





}
run().catch(console.dir);








app.get('/', (req, res) => {
    res.send('Server Running Successfully');
});

app.listen(port, (req, res) => {
    console.log(`Listening port on ${port}`);
});