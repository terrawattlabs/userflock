ufApp.controller('InterviewDetailCtrl', 
   	['$scope', '$timeout', '$routeParams', 'growl', '$location',
   	function ($scope, $timeout, $routeParams, growl, $location) {

   		$scope.selprojectID = $routeParams.projectID;
   		$scope.oneAtATime = true;
   		$scope.intID = $routeParams.selID;

   		var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    // At least Safari 3+: "[object HTMLElementConstructor]"
var isChrome = !!window.chrome && !isOpera;              // Chrome 1+
var isIE = /*@cc_on!@*/false || !!document.documentMode;   // At least IE6

if (isFirefox) {
	$scope.FireFoxWarn = "Audio recorded from the mobile app will not play in Firefox, please try a different browser like Google Chrome. Sorry, we are working on fixing it.";
};




   			var currentUser = Parse.User.current();
  			var Interviews = Parse.Object.extend("Interviews");
			var query = new Parse.Query(Interviews);
			var queryResult;

			query.equalTo("objectId", $routeParams.selID);


			query.find({
			  success: function(result) {
			  	queryResult = result;
			    var interview = result[0];
			    $scope.interview = interview;
			    $scope.name = interview.get('name');
			    $scope.rate = interview.get('rating');
			    $scope.notes = interview.get('notes');
			    $scope.takeaway = interview.get('takeaway');

			    $scope.$apply();
			    checkRecordingURL(interview);
			    convertAndPushDates(interview);
			  },
			  error: function(error) {
			    alert("Error: " + error.code + " " + error.message);
			  }
			});


			  $scope.max = 5;
			  $scope.isReadonly = false;

			  var messages = ["Not a Customer", "Unlikely Customer", "Future Customer", "Early Adopter", "First Customer"];
			  console.log(messages.length);
			  console.log(messages[0]);

			  $scope.hoveringOver = function(value) {
			    $scope.overStar = value;
			    console.log(value);
			    $scope.helper = messages[value - 1];
			    console.log($scope.helper);
			  };
 		


 		function checkRecordingURL (obj){
 			console.log(obj);
 			var interviewCallSID = obj.get('callSID');
 			console.log(interviewCallSID);
 			var Message = Parse.Object.extend("Message");
			var query = new Parse.Query(Message);

			query.equalTo("sid", interviewCallSID);
			query.find({
			  success: function(result) {
			  	console.log(result);
			 	if (result[0].get('location') == undefined) {
			    	saveNewURL(result[0], result[0].get("audioFile")._url);
			    } else {
			    	getRecording(result[0].get('sid'));
			    };
			  },
			  error: function(error) {
			    alert("Error: " + error.code + " " + error.message);
			  }
			});

 		};

 	


 		function saveNewURL (obj, url){
 			var objID = obj.id;
 			var Message = Parse.Object.extend("Message");
			var query = new Parse.Query(Message);

				query.equalTo("objectId", objID);

				query.first({
				  success: function(object) {
				     object.set("location", url);
				   	 object.save();
				   	 getRecording(object.get('sid'));
				  },
				  error: function(error) {
				    alert("Error: " + error.code + " " + error.message);
				  }
				});
 		};


 		//get the recording
 		function getRecording(sid) {
 			var interviewCallSID = sid;
 			//console.log(interviewCallSID);
 			var Message = Parse.Object.extend("Message");
			var query = new Parse.Query(Message);

			query.equalTo("sid", interviewCallSID);
			query.find({
			  success: function(result) {
			    $scope.recording = result[0];
			    //console.log(result[0]);
			    $scope.recordingURL = result[0].get('location');
			    $scope.$apply();
			  },
			  error: function(error) {
			    alert("Error: " + error.code + " " + error.message);
			  }
			});
 		};

	$scope.$watch('recordingURL', function() {
       $("audio").attr("src",$scope.recordingURL);
   });

	$scope.seekTime = function (t){
		console.log("got this time" + t);
		console.log($('#recordingPlayer'));
		$('#recordingPlayer')[0].currentTime = t;
	};

	function convertAndPushDates (data) {
				var jsDate = new Date(data.createdAt); 
				var year = jsDate.getFullYear();
				var month = jsDate.getMonth() + 1;
				var day = jsDate.getDate();
				var hours = jsDate.getHours();
				var minutes = jsDate.getMinutes();
					if (minutes < 10) {
						minutes = "0" + minutes;
					};
				var createdAtReadableDate = hours + ":" + minutes + " on " + month + "/" + day + "/" + year;
				$scope.readableDate = createdAtReadableDate;
				$scope.$apply();

			};


 	$scope.updateNotes = function() {

 				var newNotes = $scope.notes;
 				var newName = $scope.name;
 				var newRating = $scope.rate;
 				var newTakeaway = $scope.takeaway;
	 			var Interviews = Parse.Object.extend("Interviews");
				var query = new Parse.Query(Interviews);

				query.equalTo("objectId", $routeParams.selID);

				query.first({
				  success: function(object) {
				     object.set("notes", newNotes);
				     object.set("name", newName);
				     object.set("rating", newRating);
				     object.set("takeaway", newTakeaway);
				   	 object.save();
				   	 makeNotification("success", "Notes Saved!");
				  },
				  error: function(error) {
				    alert("Error: " + error.code + " " + error.message);
				  }
				});
 	}; //end update notes

 	$scope.goToPage = function(path){
		$location.path(path);
	};
 	
 	function makeNotification (type, msg) {
 		console.log('running notification function');
 		if (type == "success") {
 			console.log('type was success');
 			growl.addSuccessMessage(msg);
 		};
 		console.log(msg);
 	};

 	$scope.options = {
	  playlist: ['./assets/beep-02.mp3'],
	  loop: true
		};

 $scope.editable = false;
 $scope.toggleMsg = "Click here to edit";

    $scope.toggleNotes = function (){
    	$scope.editable = !$scope.editable;
    	if ($scope.editable == true) {
    		$scope.toggleMsg = "Finished Editing";
    		
    	} else {
    		$scope.toggleMsg == "Click here to edit";
    		$scope.updateNotes();
    	};
    };

    $scope.send = false;

    $scope.showSend = function(){
    	$scope.send = !$scope.send;
    };

   $scope.sendInterview = function (){

   		var link = "http://userflock.parseapp.com/#/interviewro/" + $scope.selprojectID + "/" + $scope.intID;

   		 Parse.Cloud.run('sendEmail', {
            "recipient": $scope.toEmail,
            "sender": "hello@userflock.com",
            "subject": currentUser.get('name') +  " has sent you a link to an interview they did with " + $scope.name + "!",
            "bodyHTML": "<p>Hi,</p>" + 
            "<p>Looks like your teammate <strong>" + currentUser.get('name') + "<strong> has sent you a link to an interview they did with <strong>" +$scope.name + "</strong>.</p>" +
            "<p><a href='" + link +"'>Click here to view the notes and listen to the recording.</a></p>" +
            "<p>They also added a message for you:</p>" +
            "<p><strong>" + $scope.addMsg + "</strong></p>" +
            "<p>Thanks!</p>" +
            "<p>The UserFlock Team!</p>"

        }, {
          success: function(result) {
            // console.log(result);
            $scope.send = false;
            $scope.toEmail = "";
            $scope.addMsg = "";
            growl.addSuccessMessage("Message was sent.");

        
        },
          error: function(error) {
            // console.log(error);
          }
        });

   };

}]);