var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");

var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 5000));

app.get("/", function (req, res) {
  res.send("Deployed!");
});

app.get("/webhook", function (req, res) {
  if (req.query["hub.verify_token"] === process.env.VERIFICATION_TOKEN) {
    console.log("Verified webhook");
    res.status(200).send(req.query["hub.challenge"]);
  } else {
    console.error("Verification failed. The tokens do not match.");
    res.sendStatus(403);
  }
});

app.post("/webhook", function (req, res) {
  console.log('POST request has come in : ' + JSON.stringify(req.body, null, 4));
  var reqBody = req.body;
  var changesObj  = reqBody.entry[0].changes[0];
  if(changesObj != null){
  }
  var i;
  for(i in reqBody.entry){
       var currSubObject = reqBody.entry[i];
       if(currSubObject.changes !== undefined) {
          var j
          var currChangeObject
          for(j in currSubObject.changes){
              currChangeObject = currSubObject.changes[j]
              if(currChangeObject.field === "leadgen") {
                  handleLeadgenSync(currChangeObject); //TODO change to async later
              }
          }
       }
       else if(currSubObject.messaging !== undefined) {
          console.log("inside 'messaging' section")
          handleMessageSync(req); //TODO change to async later
       }
  }
  
});

var spiniBackendAPIEndpoint = "https://api.getspini.com:8443/SpinGrailsApp/external/webhook/fb/leadgen"
var spiniAPIAccessToken = process.env.API_TOKEN

function handleLeadgenSync(p_currChangeObject){

    var leadgenID = p_currChangeObject.value.leadgen_id
    console.log("going to handle leadgen for leadgen id : " + leadgenID)

    var restlerPost = restler.postJson(spiniBackendAPIEndpoint, p_currChangeObject.value,{
        timeout: 10000,
        headers : {
            'X-SPIN-API-ACCESS-TOKEN' : spiniAPIAccessToken
        }
    });

    restlerPost.on('complete', function(data, response) {
        console.log("call to backend API was completed for leadgen : " + leadgenID + " with status code : "+ response.statusCode.toString());
        console.log("response headers : " + JSON.stringify(response.headers));
        console.log("response payload : " + JSON.stringify(data));
    });

    restlerPost.on('timeout', function() {
        console.log("timed out in calling the backend API : " + spiniBackendAPIEndpoint + "  for trackingID : " + leadgenID);
    });
}
