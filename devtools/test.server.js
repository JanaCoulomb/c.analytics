'use strict'

//intialize some stuff like express and multer

const express = require('express')
var multer = require('multer');

const forms = multer();
const app = express()

app.use(express.urlencoded({ extended: true }));
app.use(forms.array()); 
app.use(express.json());

const path = require('path');

var nodeCleanup = require('node-cleanup');
 


// inti captcha

const cdotanalytics = require('../cdotanalytics').create()


nodeCleanup(function (exitCode, signal) {
    if (signal) {
        cdotanalytics.exitHandler()
        nodeCleanup.uninstall(); // don't call cleanup handler again
        return false;
    }

});


// init captcha js and css to use in frontend html

app.use('/c.analytics',express.static('dist'));

/// init html test file

app.get('/', (req, res) => {

    res.sendFile(path.join(__dirname, '/public/index.html'));

})

app.get('/about', (req, res) => {

    res.sendFile(path.join(__dirname, '/public/about.html'));

})

app.get('/analytics', (req, res) => {

    res.send(JSON.stringify(cdotanalytics.getAnalytics()));
})

app.post('/cdotanalytics/recieveAnalyticsData',cdotanalytics.recieveAnalyticsData)
app.post('/cdotanalytics/recieveAnalyticsDeleteRequest',cdotanalytics.recieveAnalyticsDeleteRequest)


// run server

app.listen(80, () => {

    console.log('server started')

})


