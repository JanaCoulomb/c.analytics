My take on buildung a privacy centered analytics software for node js applications.


## How to setup

1. Install Package <code>npm i c.analytics</code>

2. Add Code
    2.1. Server-side

        //intialize express if not alread
        
        const express = require('express')
        const app = express()
        
    
        // inti analytics
        
        const cdotanalytics = require('c.analytics').create(app)

        // to get data now
        Console.log(cdotanalytics.getAnalytics());

    2.2. Client-Side
    
    
        <script src="/cdotanalytics/cdotanalytics.min.js" data-serveranalyticsurl='/cdotanalytics/recieveAnalyticsData' data-serverdeleteanalyticsurl='/cdotanalytics/recieveAnalyticsDeleteRequest'></script>



Go ahead and pop this in your porject :)
