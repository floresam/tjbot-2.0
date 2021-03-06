/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var TJBot = require('tjbot');
TJBot.prototype._SERVO_ARM_UP = 2300;
TJBot.prototype._SERVO_ARM_DOWN = 1200;
TJBot.prototype._SERVO_ARM_BACK = 500;
var config = require('./config');

// obtain our credentials from config.js
var credentials = config.credentials;

// obtain user-specific config
var WORKSPACEID = config.conversationWorkspaceId;

// these are the hardware capabilities that TJ needs for this recipe
var hardware = ['microphone', 'speaker', 'led', 'servo', 'camera'];

// set up TJBot's configuration
var tjConfig = {
    log: {
        level: 'verbose'
    },
    speak: { speakerDeviceId: 'plughw:0,0'},
    listen: { 
	microphoneDeviceId: 'plughw:1,0',
	inactivityTimeout: -1,
	language: 'en-US'
    }
};

// instantiate our TJBot!
var tj = new TJBot(hardware, tjConfig, credentials);

console.log("You can ask me to introduce myself or tell you a joke.");
console.log("I understand lots of colors.  You can tell me to shine my light a different color by saying 'turn the light red' or 'change the light to green' or 'turn the light off'.");
console.log("Try saying, \"" + tj.configuration.robot.name + ", please introduce yourself\" or \"" + tj.configuration.robot.name + ", who are you?\"");
console.log("You can also say, \"" + tj.configuration.robot.name + ", tell me a joke!\"");

// send to the conversation service
tj.converse(WORKSPACEID, "hi", function(response) {
    // speak the result
    tj.speak(response.description);
});
var greeter = "off";
var greetCount = 0;
tj.shine("off");
function contains(str, prefix)
{
	return str.index(prefix);
}
// listen for utterances with our attentionWord and send the result to
// the Conversation service
tj.listen(function(msg) {
    // check to see if they are talking to TJBot
    //if (msg.startsWith(tj.configuration.robot.name)) {
    var index = msg.indexOf(tj.configuration.robot.name);
    console.log(tj.configuration.robot.name);
    console.log(msg);
    console.log(index);
    if (index > -1) {
        // remove our name from the message
        //var turn = msg.toLowerCase().replace(tj.configuration.robot.name.toLowerCase(), "");
        // remove our name & noise from the message
        var turn = msg.toLowerCase().substring(0, index);
        turn = msg.toLowerCase().replace(tj.configuration.robot.name.toLowerCase(), "");

        // send to the conversation service
        tj.converse(WORKSPACEID, turn, function(response) {
	    console.log(tj._assistantContext[WORKSPACEID].number_greeted);
            tj.pauseListening();
            // speak the result
            tj.speak(response.description);
	    console.log(response.object.output);
	    if(response.object.output.action) {
	        var action = response.object.output.action;
		if(action.light) {
		    tj.shine(action.light);
		}
                if(action.salute) {
		    if(action.salute == "on") { tj.raiseArm(); }
		    else if (action.salute == "off") { tj.lowerArm(); }
		}
		if(action.wave) {
	            tj.wave();
		    tj._assistantContext[WORKSPACEID].number_greeted+= 1;
		    //greeter = action.wave;
		}
		if(action.salute) {
		    if(action.salute === "on") {
	                tj.raiseArm();
		    } else {
	                tj.lowerArm();
		    }
		}
		if(action.see) {
                    console.log("Attempting to see!");
                    tj.see().then(function(objects) {
                        //console.log(objects[0]);
			objects.sort(function(a,b){ return b.score -a.score; });
                        console.log(JSON.stringify(objects));
			tj._assistantContext[WORKSPACEID].last_seen = objects;
			var classes = [];
                        for(var i=0; i<objects.length; i++) {
			    classes[i] = objects[i].class;
                        }
		        tj._assistantContext[WORKSPACEID].last_seen = classes;
			// send to the conversation service
			tj.converse(WORKSPACEID, "", function(response) {
			    //console.log(tj._assistantContext[WORKSPACEID].last_seen);
			    // speak the result
                            setTimeout(function() {
			      tj.speak(response.description);
			    }, 3000);
			    //console.log(response.object.output);
			});
                    }).catch(function(err) {
			console.log(JSON.stringify(err));
		    });
                }
		if(action.hvt) {
                    console.log("Attempting to see hvts!");
                    tj.seehvt().then(function(objects) {
			objects.sort(function(a,b){ return b.score -a.score; });
                        console.log(JSON.stringify(objects));
			tj._assistantContext[WORKSPACEID].last_seen = objects;
			var classes = [];
                        for(var i=0; i<objects.length; i++) {
			    classes[i] = objects[i].class;
                        }
		        tj._assistantContext[WORKSPACEID].last_seen = classes;
			// send to the conversation service
			tj.converse(WORKSPACEID, "", function(response) {
			    //console.log(tj._assistantContext[WORKSPACEID].last_seen);
			    // speak the result
                            setTimeout(function() {
			      tj.speak(response.description);
			    }, 3000);
			    //console.log(response.object.output);
			});
                    }).catch(function(err) {
			console.log(JSON.stringify(err));
		    });
                }
	        console.log(JSON.stringify(action));
	    }
            tj.resumeListening();
	    //console.log(JSON.stringify(response.object.output));
        });
    }
    if(greeter == "on") {
        tj.pauseListening();
        tj.wave();
        tj._assistantContext[WORKSPACEID].number_greeted+= 1;
        console.log(JSON.stringify(tj._assistantContext[WORKSPACEID].number_greeted));
        tj.resumeListening();
    }
});

