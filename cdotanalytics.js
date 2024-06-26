var fs = require('fs');
const path = require('path');
const express = require('express')
const isbot = require('isbot');
const nodeCleanup = require('node-cleanup');


var objecthash = require('object-hash');
var parser = require('accept-language-parser');


var instance;

function ensureDirectoryExistence(filePath) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
      return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

function create(app,params) {
    exports.instance = new CdotAnalytcs(params)


    // inti nodeCleanup
    nodeCleanup(function (exitCode, signal) {
        if (signal) {
            exports.instance.exitHandler()
            nodeCleanup.uninstall(); // don't call cleanup handler again
            return false;
        }

    });

    app.use( exports.instance.params.urlbase,express.static(path.join(__dirname, 'dist')));
 
    app.post( exports.instance.params.urlbase+'/recieveAnalyticsData',express.json(), exports.instance.recieveAnalyticsData)
    app.post( exports.instance.params.urlbase+'/recieveAnalyticsDeleteRequest',express.json(), exports.instance.recieveAnalyticsDeleteRequest)

}

class CdotAnalytcs {

    constructor(params) {
        params = params || {}

        params.path = params.path || "c.analytics"
        params.urlbase = params.urlbase || "/c.analytics"


        params.askConsent = params.askConsent || true

        params.filter = params.filter || {}


        params.logIp = params.logIp || false

        params.indexPages = params.indexPages || false

        
        this.params = params

        this.connectedmap = new Map();

        this.currentLogPath = params.path + "/" + "logs-" + encodeURIComponent(new Date().toISOString().substring(0, 10));

        ensureDirectoryExistence(this.currentLogPath);

        this.fsLog = fs.createWriteStream(this.currentLogPath, {
            flags: 'a'
        })

        setInterval(this.update, 5 * 60 * 1000);
    }

    exitHandler() {
        new Map( this.connectedmap).forEach((value, key, map) => {

            this.endClientConnection(key);
        
          })
    }

    gethash = (req) => {
        var acceptLanguage = (req.get("accept-language") ? req.get("accept-language") : "AcceptLanguage");
        var acceptEncoding = (req.get("accept-encoding") ? req.get("accept-encoding") : "NoAcceptedEncoding");
        var remoteAddress = (req.socket.remoteAddress);
        var userAgent = (req.get("user-agent") ? req.get("user-agent") : "NoUserAgent");

        return objecthash({acceptLanguage,acceptEncoding,remoteAddress,userAgent});
    }

    saveConnection = (data) => {
        this.fsLog.write(JSON.stringify(data)+""+('\n'));
    }    

    recieveAnalyticsData = (req, res) =>  {

        //bot check just i case
        if(!isbot.isbot(req.get("user-agent")))
        {
            var hash = this.gethash(req);
   
            var client = undefined;
    
    
            if(!this.connectedmap.has(hash))
            {
    
    
                client = {startdate:new Date(),pagemap:[]};
    
                if(req.get("accept-language"))
                {
                    var languagesshort = [];
                    parser.parse(req.get("accept-language")).forEach(v => {
                        languagesshort.push({c:v.code,r:v.region,q:v.quality});
                    })
                    client.languages = languagesshort;
                }
            }
            else {
                client = this.connectedmap.get(hash);
    
            }
           
            
    
        
    
            client.lastupdatetime = new Date().getTime()
    
            //if no time specified, we use 5 seconds
            var timetoadd = req.body.totalTime ? req.body.totalTime : 5 * 1000;
            
            //if very long time we cap to 5 min cause thats unrealistic
            if(timetoadd > 1000 * 60 * 5)
                timetoadd = 1000 * 60 * 5;
    
            var title = req.body.siteTitle;
    
        
            if(client.pagemap.length > 0 && client.pagemap[client.pagemap.length-1].title == title)
                client.pagemap[client.pagemap.length-1].time += timetoadd;
            else
                client.pagemap.push({title:title,time:timetoadd});
    
    
            this.connectedmap.set(hash,client);
        }

        


    }   

    endClientConnection = (key) => {
        var client = this.connectedmap.get(key);
        var visitId = (Math.random().toString(18).slice(2) + client.startdate.getTime().toString(18).slice(2))



        this.saveConnection({
            visitId: visitId,
            utc: client.startdate.toISOString().substring(0, 10) ,
            day: client.startdate.getDay() ,
            hour: client.startdate.getHours(),
            pages: client.pagemap,
            languages: client.languages
        });

        this.connectedmap.delete(key);

    }
  
    
    update = () => {
        new Map( this.connectedmap).forEach((value, key, map) => {

            if(value.lastupdatetime < new Date().getTime() - 1000 * 60 * 30)
            {
                this.endClientConnection(key);
            }
          })
    }
  
    recieveAnalyticsDeleteRequest = (req, res) =>  {
        //bot check just i case
        if(!isbot.isbot(req.get("user-agent")))
        {
            var hash = gethash(req);
            this.connectedmap.delete(hash);
        }

    }    

    getAnalyticsEntries() {
        var entries = [];

        var path = this.params.path;
    
        var dir = fs.readdirSync(path);
        for (var i = 0; i < dir.length; i++) {
          var name = dir[i];
          var target = path + '/' + name;
      
          var stats = fs.statSync(target);
        
          if (stats.isFile()) {
    
            var o = fs.readFileSync(target, 'utf8').split(/\r?\n|\r|\n/g);
         
            o.forEach(element => {
                try {
                    if(element != '')
                        entries.push(JSON.parse(element));
                } catch (error) {
                    
                }
    
            });
      
         
            
          } else if (stats.isDirectory()) {
            entries.push(this.getAnalyticsEntries(target));
        
          }
        
    
        }
    
        return entries;
    } 

    getAnalytics() {

    
        var entries = this.getAnalyticsEntries();
    
        var getStatsPerPageTime = {}; 
        var getStatsPerPageVisits = {}; 

        var getStatsPerLanguage = {}; 
        var getStatsPerFirstLanguage = {}; 

        var getRequestsPerDay  = [];
        var getRequestsPerHour  = [];

        var getVisitHistoryByDay = [];
        var getEngagementHistoryByDay = [];
        for (let i = 0; i < 20; i++) {
            getVisitHistoryByDay.push(0);
            getEngagementHistoryByDay.push(0);

        }
        var getVisitHistoryByWeek = [];
        var getEngagementHistoryByWeek = [];
        for (let i = 0; i < 12; i++) {
            getVisitHistoryByWeek.push(0);
            getEngagementHistoryByWeek.push(0);

        }
        var getVisitHistoryByHours = [];
        var getEngagementHistoryByHours = [];
        for (let i = 0; i < 24; i++) {
            getVisitHistoryByHours.push(0);
            getEngagementHistoryByHours.push(0);
        }

        var getAverageTime  = 0;    
    
        for (let index = 0; index < 7; index++) {
            getRequestsPerDay.push(0);  
        }
       
        for (let index = 0; index < 24; index++) {
            getRequestsPerHour.push(0);  
        }
    
        entries.forEach(element => {

            if(element.visitId)
            {
                var timespent = 0;
                var pagecount = element.pages.length;
                var longvisitpagecount = 0;


                element.pages.forEach(page => {
                    timespent += page.time;
    
                    if(!getStatsPerPageVisits[page.title])
                        getStatsPerPageVisits[page.title] = 1;
                    else
                        getStatsPerPageVisits[page.title] += 1;
        
                    if(!getStatsPerPageTime[page.title])
                        getStatsPerPageTime[page.title] = page.time;
                    else
                        getStatsPerPageTime[page.title] += page.time;

                    if(page.time > 15 * 1000)
                        longvisitpagecount++;
                   
                });
                getAverageTime+=timespent;

                //calc engagement
                var engagement = Math.round((Math.pow(timespent/1000+1,1/4)+Math.sqrt(pagecount)*0.5+Math.sqrt(longvisitpagecount+1)*0.5)*100)/100;

    
    
                element.languages.forEach(language => {
    
                    var n = language.r ? language.c + "-" + language.r : language.c;
                 
                    if(!getStatsPerLanguage[n])
                        getStatsPerLanguage[n] = language.q;
                    else
                        getStatsPerLanguage[n] += language.q;
    
                    if(language.q >= 1)
                    {
                        if(!getStatsPerFirstLanguage[n])
                            getStatsPerFirstLanguage[n] = 1;
                        else
                            getStatsPerFirstLanguage[n] += 1;
                    }
                   
                });
            
                let d = new Date(element.utc);
            
                let Difference_In_Time = (Date.now() - new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), element.hour)));
                    
                let Difference_In_Hours = Math.round(Difference_In_Time / (1000 * 3600));
                let Difference_In_Days = Math.floor(Difference_In_Time / (1000 * 3600 * 24));
                let Difference_In_Weeks = Math.floor(Difference_In_Time / (1000 * 3600 * 24) / 7);
              
    
                if(getVisitHistoryByDay.length > Difference_In_Days)
                    getVisitHistoryByDay[Difference_In_Days] += 1;
                if(getEngagementHistoryByDay.length > Difference_In_Days)
                    getEngagementHistoryByDay[Difference_In_Days] += engagement;
                
                if(getVisitHistoryByWeek.length > Difference_In_Weeks)
                    getVisitHistoryByWeek[Difference_In_Weeks] += 1;
                if(getEngagementHistoryByWeek.length > Difference_In_Weeks)
                    getEngagementHistoryByWeek[Difference_In_Weeks] += engagement;
                
                if(getVisitHistoryByHours.length > Difference_In_Hours)
                    getVisitHistoryByHours[Difference_In_Hours] += 1;
                if(getEngagementHistoryByHours.length > Difference_In_Hours)
                    getEngagementHistoryByHours[Difference_In_Hours] += engagement;
                        
    
                    
            
                getRequestsPerDay[element.day]+=1;
                getRequestsPerHour[element.hour]+=1;
            }
    

            
        });
        
    
    
        getAverageTime = Math.round(getAverageTime / entries.length);
    
        return {getStatsPerPageTime,getStatsPerPageVisits,getStatsPerLanguage,getStatsPerFirstLanguage,getRequestsPerDay,getRequestsPerHour,getVisitHistoryByDay,getVisitHistoryByWeek,getVisitHistoryByHours,getEngagementHistoryByDay,getEngagementHistoryByWeek,getEngagementHistoryByHours,getAverageTime};
    
    }

}

module.exports.create = create;
module.exports.instance = instance;