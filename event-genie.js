var http = require('http');
var file = require('fs')


/**
 * This function extracts the nexToken from response to fetch next set of events.
*/
function extractNextToken(linksArray){

    if(linksArray.length!=0){

        var urlArray = linksArray[0].href.split(/[=&?]+/)

        if(urlArray.includes("nextToken")){

            nextToken = "&nextToken="+urlArray[urlArray.length-1]
            
            options.path = eventPath + nextToken
            console.log(options.host+options.path)

            return nextToken
        }
        else{
            console.log("Coudnt Fetch NextToken from link : "+linksArray[0].href)
        }

    }

    return "NO_MORE_EVENTS"

}


/**
 * This method checks if the Hypertrial link with nextToken is present. If it is present, then it fetches the token and requests for the next set of events until, all events are fetched. It happens in a recursive way.
*/
function fectchAgainIfPossible(links){
    var extractedToken = extractNextToken(links)
    if(extractedToken!="NO_MORE_EVENTS" && count!=fetchLimit){
        console.log("****************************************************************************************************")
        console.log("****************************************************************************************************")
        http.request(options,afterRequest).end()
    }
}


function filterEventsWithObjectAndValues(event){
    
    for(let i=0; i<eventFilterArray.length; i+=2){
        if( !( Object.keys(event).includes(eventFilterArray[i]) 
                && Object.values(event[eventFilterArray[i]]).includes(eventFilterArray[i+1]) ) ){
            return false;
        }
    }
    return true;
}


/**
 * Prints the events after converting epoch to GMT time in milliseconds
*/
function formatAndPrint(event){
    var date = new Date(event.action_epoch/1000)
    event.action_epoch = date.toUTCString()+" "+date.getUTCMilliseconds()+"ms"
    if(filterEventsWithObjectAndValues(event)){
        console.log(event)
        console.log("****************************************************************************************************")
    }
}


/**
 * Prints the Event Data Fetched from Hypertrial
*/
    function printEvents(data){

    data.forEach(element => {
        if(!unwantedEvents.includes(element.event_type)){
            formatAndPrint(element)
        }
    });

}


/**
 * This method generates the Options Object required for making HTTP request
*/
function generateOption(config){
    var keys = Object.keys(config)
    var opts = {}

    opts.host = config.host
    opts.path = "/events?"

    keys.splice(keys.indexOf('host'),1)

    keys.forEach(key => {
        
        if(config[key]!=""){
            opts.path+= key+"="+config[key]+"&"
            
        }
    })

    opts.path = opts.path.slice(0,opts.path.length-1)

    return opts
}

/**
 * Callback function that calls methods needs to be executed after processing the request
*/
function afterRequest(response){

    count++
    let resp=''

    response.on('data',data=>{
        resp = resp + data
    })

    response.on('end', function(){
        let responseData = JSON.parse(resp)
        printEvents(responseData.data)
        fectchAgainIfPossible(responseData.links)
    })

}

var config = JSON.parse(file.readFileSync("config.json"));
var unwantedEvents = ['USER_LOGOUT','PASSWORD_CHANGED','TOKEN_GENERATED','USER_LOGIN','USER_LOGIN_FAILED'];
var eventFilterArray = [];
var options = generateOption(config);
var eventPath = options.path;
var count=0;
var fetchLimit=30;

var nextToken="";

/**
 * Request is made only after printing the url path that is going to be used 
*/
options.path = eventPath + nextToken
console.log(options.host+options.path)
http.request(options,afterRequest).end()



