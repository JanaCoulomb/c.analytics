My take on buildung a privacy centered analytics software for node js applications.


## How to setup

1. Install Package <code>npm i c.analytics</code>

2. Add Code
    2.1. Server-side

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
        
        // inti nodeCleanup
        
        nodeCleanup(function (exitCode, signal) {
            if (signal) {
                cdotanalytics.exitHandler()
                nodeCleanup.uninstall(); // don't call cleanup handler again
                return false;
            }
        
        });

        // init captcha js and css to use in frontend html

        app.use('/c.analytics',express.static('dist'));

        app.post('/cdotanalytics/recieveAnalyticsData',cdotanalytics.recieveAnalyticsData)
        app.post('/cdotanalytics/recieveAnalyticsDeleteRequest',cdotanalytics.recieveAnalyticsDeleteRequest)

    2.2. To Check if User is Verified: <code>captcha.isVerified(req);</code> (use this on server side)

    2.3. Client-Side
    
    
        <script src="/c.analytics/cdotanalytics.min.js" data-serveranalyticsurl='/cdotanalytics/recieveAnalyticsData' data-serverdeleteanalyticsurl='/cdotanalytics/recieveAnalyticsDeleteRequest'></script>



Go ahead and pop this in your porject :)
