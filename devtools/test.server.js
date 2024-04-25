'use strict'

//intialize some stuff like express and multer

const express = require('express')

const app = express()

const path = require('path');

const cdotanalytics = require('../cdotanalytics').create(app)


app.get('/', (req, res) => {

    res.sendFile(path.join(__dirname, '/public/index.html'));

})

app.get('/about', (req, res) => {

    res.sendFile(path.join(__dirname, '/public/about.html'));

})

app.get('/analytics', (req, res) => {

    res.send(JSON.stringify(require('../cdotanalytics').instance.getAnalytics()));
})


// run server

app.listen(80, () => {

    console.log('server started')

})


