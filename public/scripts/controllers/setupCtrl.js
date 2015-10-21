ufApp.controller('SetupCtrl', 
   	['$scope', '$timeout', '$routeParams', '$modal', '$log', '$window', '$location', 'growl',
   	function ($scope, $timeout, $routeParams, $modal, $log, $window, $location, growl) {
   		var currentUser = Parse.User.current();
   		$scope.user = currentUser;

   		$scope.projectTitle;
   		$scope.projectDescription;
   		$scope.userPhoneNumber;
   		$scope.targetDescription;
   		$scope.targetTitle;
   		$scope.questions = "<p><ul><li>What's your biggest problem around <strong>[topic of problem you are solving]</strong>?</li><li>Why is that a problem?</li><li>What are you currently doing to solve that problem?</li><li>What do you like or dislike about that solution?</li></ul><br><br>Remember: Don't pitch your solution, have a conversation about their problems!</p>"
   		$scope.initialProject;
   		$scope.setupStep = 1;


   		$scope.addStep = function(){
   			
   			$scope.setupStep = $scope.setupStep + 1;
   			console.log('added step, current step is == ' + $scope.setupStep);
   		};

   		$scope.subStep = function(){
   			$scope.setupStep = $scope.setupStep - 1;
   		};

   		$scope.setStep = function(step){
   			$scope.setupStep = step;
   		};

   		$scope.submitProject = function (){
   			saveProject();
   			console.log('submitted project');

   			$scope.addStep();
   		};

   		$scope.saveItAll = function () {
   			$location.path('/projdetail/' + $scope.initialProject.id);
   		};

   		$scope.sendRequest = function (){
   			//make it ring with 1 interview
   		};

   		$scope.saveTemplate = function (){
   			saveTemplate();
   			$scope.addStep();
   		};

   		$scope.saveQuests = function (){
   			saveQuestions();
   			$scope.addStep();
   		};



   		$scope.couponHelperMsg = ""
   		$scope.findCoupon = function(){
   			if ($scope.givenCode == "") {
   				$scope.couponHelperMsg = "";
   			} else {
   				Parse.Cloud.run('getCoupon', {
   				"givenCode": $scope.givenCode
   			}, {
   				success: function (result){
   					if (result.percent_off == 100 && result.duration == "once") {
   						$scope.couponHelperMsg = "First Month Free! No charges today!"
   						$scope.$apply();
   					};
   				},
   				error: function (error) {
   					$scope.couponHelperMsg = "Sorry, we couldn't find that coupon."
   					console.log(error);
   					$scope.$apply();
   				}
   			});
   			};
   			
   		};

   		


   		$scope.handleStripe = function(status, response){
        if(response.error) {
          growl.addErrorMessage('It did not work. try again')
        } else {
          // got stripe token, now charge it or smt
          
          var token = response.id;
          var name = currentUser.get('name');
          var email = currentUser.get('email');
          var couponCode = $scope.givenCode;

          Parse.Cloud.run('createCustomer', {
		      		 "card": token,
		      		 "email": email,
		      		 "coupon": couponCode,
		      		 "description": name,
		      		 "plan": "fullprice"
		    		}, {
		    			success: function(result) {
		    			 console.log(result);
		    			 updateUser(result);
		    		},
					    error: function(error) {
					   	  growl.addErrorMessage('Sorry there was a problem, try again');
					      console.log(error);
					    }
		  			});
		        }
		    };

   		function createCustomer (name, email, token){
   			Parse.Cloud.run('createCustomer', {
      		 "name": name,
      		 "card": token,
      		 "email": email
    		}, {
    			success: function(result) {
    				console.log(result);
    				updateUser(result);
    				gotoSetup();
    				//subscribe the customer

    		},
			    error: function(error) {
			      console.log(error);
			    }
  			});
   		};

   		function subscribeCustomer (){
   			//subscribe the customer 
   		};

   		function updateUser(result) {
   			currentUser.save(null, {
				success: function(user) {
					currentUser.set("customerID", result.id);
					currentUser.save();
					$scope.addStep();
					$scope.$apply();
					$scope.getPhoneNumbers();
					createCalendar(currentUser.get('email'));
				}
			});
   		};


   		$scope.getPhoneNumbers = function () {
    	console.log('got to the function');
    	var areaCodeInput = $scope.areaCode;
    	if (!areaCodeInput || areaCodeInput == "") {
    		areaCodeInput = "734";
    	};

    	Parse.Cloud.run('getAvailNumbers', {
      		 "areaCode": areaCodeInput
    		}, {
    			success: function(result) {
					$scope.availNumbers = result;
					$scope.$apply();
					$scope.purchaseNumber(result[0].phone_number, result[0].friendly_name);
    		},
			    error: function(error) {
			     
			    }
  			});

    };
    
    $scope.purchaseNumber = function (phone, friendly) {
    	var phoneNumber = phone;
    	var email = currentUser.get('email');
    	var userID = currentUser.id;
    	console.log(phoneNumber + " " + email + " " + " " + userID);
    	$scope.userPhoneNumber = friendly;

    	$scope.$apply();
    	

    	currentUser.save(null, {
			success: function(user) {
				currentUser.set("number", friendly);
				setPhone(friendly);
				currentUser.save();
			}
		});

    	Parse.Cloud.run('purchaseNumber', {
      		 "email": email,
      		 "userID": userID,
      		 "phone": phoneNumber
    		}, {
    			success: function(result) {
    				console.log('you bought the number');
    				console.log(result);
    		},
			    error: function(error) {
			     	//sendConfirmEmail(phoneNumber, email);
			    }
  			});
		//$scope.addStep();

    };

   			 var selectedPhoneNumber;
			function setPhone(num){
				selectedPhoneNumber = num;
			};

   function createCalendar (e){
    Parse.Cloud.run('newCalendar', {
      "email": e
    }, {
          success: function(result) {
            var data = $.parseJSON(result);
            saveUserCal(data.resource['id']);
            $scope.calendarNumber = data.resource['id'];
            createProvider(data.resource['id']);
        },
          error: function(error) {
            console.log(error);
          }
        });
    };

$scope.calParseID;
    function saveUserCal(calID) {
    	var CalendarSettings = Parse.Object.extend("CalendarSettings");
		var calendarSetting = new CalendarSettings();

		calendarSetting.set("User", Parse.User.current());
		calendarSetting.set("CalendarNumber", calID);

		calendarSetting.save(null, {
		  success: function(calendarSetting) {
		    console.log("whole object: " + calendarSetting);
		    $scope.calParseID = calendarSetting.id;
		    sendConfirmEmail(selectedPhoneNumber, currentUser.get('email'), currentUser.get('name'), calID);

		  },
		  error: function(calendarSetting, error) {
		  }
		});

    };

    function createProvider(id) {
    	Parse.Cloud.run('newProvider', {
      "calID": id
    }, {
          success: function(result) {
            console.log(result);
        },
          error: function(error) {
            console.log(error);
          }
        });
    };
		 

    function sendConfirmEmail(num, em, name, cal) {
    	Parse.Cloud.run('sendEmail', {
        	  "recipient": em,
        	  "sender": "hello@userflock.com",
        	  "subject": "Welcome to UserFlock, " + name + "!" ,
        	  "bodyText": "You've signed up successfully, your phone number is " + num + ". Feel free to give that out to people and have them call you. You can also check your settings page to see your unique scheduling link.",
        	  "bodyHTML": "<p>Hi there!<br>" 
        	  + "Thanks for signing up for UserFlock; we're glad to have you as a part of our customer-centric community."
        	  +"<br>Here are a few items to help you get started:"
        	  +"<ul>"
        	  	+"<li>" + "Your scheduling link is <pre>http://userflock.parseapp.com/#/schedule" + cal + "</pre></li>"
        	  	+"<li>" + "Your dedicated in browser phone number is <strong>" + num + "</strong></li>"
        	  	+"<li>" + "Feel free to give that number out to anyone you want to talk to (have your mom call you!)</li>"
        	  	+"<li>" + "Your paid plan includes unlimited calls & recorded minutes</li>"
        	  +"</ul>"
        	  +"If you have any other questions, reply directly to this email!"
        	  + "</p>"
        	  +"<p>Or, if you'd prefer you can schedule a call with one of our founders here:</p>"
        	  +"<p><a href='http://www.google.com/'>Steven Sherman</a> (don't worry, he doesn't bite)<br>"
        	  +"<a href='http://userflock.parseapp.com/#/schedule/2681'>Jack Dean</a> (okay he does bite, but you'll live)</p>"
        	  +"<p>Thanks!<br>"
        	  +"UserFlock Team</p>"

    		}, {
    			success: function(result) {
    			  console.log(result);
    			  
    		
    		},
			    error: function(error) {
			      console.log(error);
			    }
  			});
		};

    		

			var parseFile;
    	function saveProject() {

   			var Projects = Parse.Object.extend("Projects");
  			var project = new Projects();

  			var title = $scope.projectTitle;
  			var description = $scope.projectDescription;
  			var sharedUsersList = [];

  				project.set("title", title);
				project.set("description", description);
				project.set("user", currentUser);
				project.set("sharedUsers", sharedUsersList)
				 
				project.save(null, {
				  success: function(proj) {
				  	$scope.initialProject = proj;
				    checkDefaultProj(proj);
				    saveQuestions();
				  },
				  error: function(proj, error) {
				    // Execute any logic that should take place if the save fails.
				    // error is a Parse.Error with an error code and description.
				    alert('Failed to create new object, with error code: ' + error.message);
				  }
				});

			 var fileUploadControl = $("#profilePhotoFileUpload")[0];
		      if (fileUploadControl.files.length > 0) {
		        console.log('heard the upload');
		        var file = fileUploadControl.files[0];
		        var ext = createFile(file);

		        
		      };

		      parseFile.save().then(function() {
		        console.log('file got saved');
		       findCalendarSave();
		      }, function(error) {
		        console.log(error);
		        console.log('filec couldnt be saved');
		      });
   		};

   		function createFile(file) {
		    var fname = file.name;
		    var name = 'photo.' + fname.split('.').pop();
		    parseFile = new Parse.File(name, file);
		  };

   		  function findCalendarSave () {
		   console.log('tried to save the calendar');
		  var CalendarSettings = Parse.Object.extend("CalendarSettings");
		  var query = new Parse.Query(CalendarSettings);
		  var id = $scope.calParseID;
		  query.get(id, {
		    success: function(cal) {
		      cal.save(null, {
		            success: function(user) {
		              cal.set("companyLogo", parseFile);
		              cal.save();
		              console.log('saved the calendar with a picture');
		            }
		          });
		    },
		    error: function(object, error) {
		    	console.log(error);
		      // The object was not retrieved successfully.
		      // error is a Parse.Error with an error code and message.
		    }
		  });
		};


   			function checkDefaultProj (proj) {
   				if (!currentUser.get('defaultProj')) {
	   					currentUser.save(null, {
						success: function(user) {
							currentUser.set("defaultProj", proj);
							currentUser.save();
						}
					});
   				};
   			};

   			function setProject (projID){
   				console.log(projID);
   				var Projects = Parse.Object.extend("Projects");
				var query = new Parse.Query(Projects);
				query.equalTo("id", projID);
				query.find({
				  success: function(results) {
				    console.log(results);
				  },
				  error: function(error) {
				    alert("Error: " + error.code + " " + error.message);
				  }
				});
   			};

   			function saveTemplate (){

	   			var IntTemplate = Parse.Object.extend("IntTemplate");
				var inttemplate = new IntTemplate();

				//if requesting to make a new template, post a new template
				var title = $scope.targetTitle;
		  		var description = $scope.targetDescription;
		  		var reqInterviews = "1";
		  		var confirm = "";
		  		var relatedProject = $scope.initialProject;
			 
				inttemplate.set("title", title);
				inttemplate.set("description", description);
				inttemplate.set("confirm", confirm);
				inttemplate.set("reqInterviews", reqInterviews);
				inttemplate.set("project", relatedProject);
				 
				inttemplate.save(null, {
				  success: function(inttemplate) {
				    // Execute any logic that should take place after the object is saved.
				    console.log('in the success block');
				    setTemplate();
				  },
				  error: function(inttemplate, error) {
				    // Execute any logic that should take place if the save fails.
				    // error is a Parse.Error with an error code and message.
				    alert('Failed to create new object, with error code: ' + error.message);
				  }
				});
			};

			var templateTitle;
			var templateDescription;
			function setTemplate(){
				templateTitle = $scope.targetTitle;
				templateDescription = $scope.targetDescription;
			};



			function saveQuestions() {
				console.log('in the save questions');
				var Questions = Parse.Object.extend("Questions");
				var questions = new Questions();

				var qTitle = "First Questions";
				var quest = $scope.questions;

				questions.set("title", qTitle);
				questions.set("questions", quest);
				questions.set("user", currentUser);
				questions.set("project", $scope.initialProject);
				 
				questions.save(null, {
				  success: function(question) {
				  	console.log(question);
				  },
				  error: function(question, error) {
				    // Execute any logic that should take place if the save fails.
				    // error is a Parse.Error with an error code and description.
				    alert('Failed to create new object, with error code: ' + error.message);
				  }
				});

			};



			$scope.open = function (size) {

		    var modalInstance = $modal.open({
		      templateUrl: 'submitInterviews.html',
		      controller: ModalInstanceCtrl,
		      size: size,
		      resolve: {
		        items: function () {
		          return $scope.items;
		        }
		      }
		    });

		    modalInstance.result.then(function (selectedItem) {
		      $scope.selected = selectedItem;
		    }, function () {
		      $log.info('Modal dismissed at: ' + new Date());
		    });
		  };


		 var ModalInstanceCtrl = function ($scope, $modalInstance, items) {

		 	$scope.setFormReference = function(intReqForm) { 
		 		$scope.intReqForm = intReqForm;
		 		$scope.intReqForm.confirm;
		 	};

		 	function pullIntInfo (){
		 			var IntTemplate = Parse.Object.extend("IntTemplate");
					var tempQuery = new Parse.Query(IntTemplate);

					tempQuery.equalTo("project", proj);
					tempQuery.descending("updatedAt");
					tempQuery.limit(1);
					tempQuery.find({
					  success: function(results) {
					  	console.log(results);
					  },
					  error: function(error) {
					    alert("Error: " + error.code + " " + error.message);
					  }
					});

		 	};
		 

		 	$scope.requestHIT = function () {
		 		var phoneNumber = currentUser.get('number');
	   			var Amthits = Parse.Object.extend("Amthits");
				var amhits = new Amthits();

				var title = "10-15 minute phone interview related to " + templateTitle;
		  		var phone = selectedPhoneNumber;
		  		var description = "A 10-15 minute phone interview with anyone who " + templateDescription;
		  		var reqInterviews = "1";
		  		var status = "pending";
		  		var confirm = $scope.intReqForm.confirm;
		  		var duration = Math.floor(reqInterviews * 0.4 * 60 + 20);

			amhits.set("title", title);
			amhits.set("phone", phone);
		    amhits.set("reqInterviews", reqInterviews);
			amhits.set("description", description);
			amhits.set("status", status);
			amhits.set("confirm", confirm);
			amhits.set("user", currentUser);
			amhits.set("duration", duration);
			amhits.set("completed", 0);

				amhits.save(null, {
	 			 success: function(amhit) {
	 			 		Parse.Cloud.run('createHIT', {
				      		 "title": title,
				      		 "description": description,
				      		 "question": description + " - Please Call *67 " + phone + " and enter the code below. (Note that dialing *67 before the number keeps your phone number anonymous).",
				      		 "numHITS": reqInterviews,
				      		 "reward": 2.05,
				      		 "duration": duration
				    		}, {
				    			success: function(result) {
				    				console.log(result);
				    				reloadPage();
				    		},
							    error: function(error) {
							      console.log(error);
							    }
				  			});
	 			}
	 		});

   		};//end new user

   		function reloadPage(){
   			$scope.$apply( function() {
	    	$location.path('/dashboard');
	     	});
   			 $window.location.reload();
   		};
		 	
			  $scope.cancel = function () {
			    $modalInstance.dismiss('cancel');
			  };
   		};
		

		  function pullSegments(){
			var Segment = Parse.Object.extend("Segment");
			var query = new Parse.Query(Segment);
			query.find({
			  success: function(results) {
			   $scope.collection = results;
			   $scope.$apply();
			  },
			  error: function(error) {
			    alert("Error: " + error.code + " " + error.message);
			  }
			});
		};

		pullSegments();

  $scope.selectedIndex = -1; // Whatever the default selected index is, use -1 for no selection
  $scope.selectedSegment;
  $scope.showSubmitNew = false;
  $scope.showSubmittedNew = false;

  $scope.itemClicked = function ($index) {
    $scope.selectedIndex = $index;
    $scope.selectedSegment = $scope.collection[$index];
    $scope.showSubmitNew = false;
  };
  $scope.showNewTargetDescription = function (){
  	$scope.itemClicked(-1);
  	$scope.showSubmitNew = true;
  };

  $scope.submitNewSegmentRequest = function(){
		  		var name = currentUser.get('name');
		  		var emailAddress = currentUser.get('email');
		  		var description = $scope.newSpecific;
		  		var newTitle = $scope.newGeneral;



  		var htmlString = "<p>Thank you for requesting a new segment with Customer Discovery Ninja.</p>"
  		+"<p>In order to provide the best possible service to our customers, we carefully and personally setup each new segment in our system.</p>"
  		+ "<p>We'll review your request and be in touch shortly. Here is a quick summary of your request:</p>"
  		+"<ul><li>You want to talk to: " + newTitle + "</li>"
  		+"<li><strong>Description: </strong>" + description + "</li>"
  		+ "</ul>"
  		+ "<p>'No reply' emails are useless, feel free to reply to this one!</p>"
  		+ "<p>Thank You,</p>"
  		+ "<p>Customer Discovery Ninja Team</p>";

			// send email to user with confirmation
    	Parse.Cloud.run('sendEmail', {
        	  "recipient": emailAddress,
        	  "sender": "info@customerdiscovery.ninja",
        	  "subject": name + ", Thanks for requesting a new segment with CD Ninja!",
        	  "bodyText": "You've requested a new segment. We'll be in touch shortly.",
        	  "bodyHTML": htmlString

    		}, {
    			success: function(result) {
    			  console.log(result);
    			  
    			  notifyCDNTeam(name, emailAddress, newTitle, description);
    		
    		},
			    error: function(error) {
			      console.log(error);
			    }
  			});
		};

		function notifyCDNTeam (name, email, title, desc) {
			var htmlString = "<p>" + name + " requested a new segment be created.</p>"
  		+"<p>Here is a quick summary of their request:</p>"
  		+"<ul><li>They want to talk to: " + title + "</li>"
  		+"<li><strong>Description: </strong>" + desc + "</li>"
  		+ "</ul>"
  		+ "<p>Thank You,</p>"
  		+ "<p>Customer Discovery Ninja Team</p>";

			// send email to user with confirmation
    	Parse.Cloud.run('sendEmail', {
        	  "recipient": "info@customerdiscovery.ninja",
        	  "sender": "info@customerdiscovery.ninja",
        	  "subject": name + " requested a new segment with CD Ninja!",
        	  "bodyText": "Requested a new segment. We'll be in touch shortly.",
        	  "bodyHTML": htmlString

    		}, {
    			success: function(result) {
    			  console.log(result);
    			  $scope.showSubmitNew = false;
    			  $scope.showSubmittedNew = true;
    			  $scope.addStep();
    			  growl.addSuccessMessage('Check Your Email! We sent a confirmation email there.');
    		
    		},
			    error: function(error) {
			      console.log(error);
			    }
  			});
		};
	
   	}]);