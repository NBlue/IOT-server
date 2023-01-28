const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const authorRoute = require('./routes/auth');
const houseRoute = require('./routes/house');
const deviceRoute = require('./routes/device');
const dataRoute = require('./routes/data');
const dataController = require('./controllers/dataController');

dotenv.config();
const app = express();

mongoose.connect(process.env.MONGODB_URL, () => {
    console.log('Connect to MongoDB successfully!');
});

app.use(cors());
app.use(morgan('common'));
app.use(bodyParser.json({ limit: '50mb' }));

// Routes
app.use('/v1/auth', authorRoute);
app.use('/v1/house', houseRoute);
app.use('/v1/device', deviceRoute);
app.use('/v1/data', dataRoute);
app.get('/', (req, res) => res.status(200).json({ message: 'Day la duong dan mac dinh!' }));

// Random data
dataController.randomAndSaveData();

app.listen(8000, () => {
    console.log('Server is running at http://localhost:8000');
});
