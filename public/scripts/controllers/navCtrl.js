ufApp.controller('NavCtrl',
   ['$scope', '$location', '$window', '$interval', '$route', '$anchorScroll', '$timeout', 'locationService', 'growl',
    function ($scope, $location, $window, $interval, $route, $anchorScroll, $timeout, locationService, growl) {
   		 var currentUser = Parse.User.current();

   		 	if (currentUser) {
   		 		if (currentUser.get('customerID')) {
			    console.log('looks like we found a customer ID');
			} else {
				console.log(currentUser.get('customerID'));
				console.log('made it to the else block, no user ID');
			    $location.path('/setup');
			    //growl.addErrorMessage("Hmm... it doesn't look like you have a subscription, please enter payment info!");
			};
   		
   		 	};
   		 	 

   		 $scope.currentUser = currentUser;
   		 console.log(currentUser);

		  $scope.logOut = function () {
	    	Parse.User.logOut();
	    	console.log('logged out');
		
			 $scope.goToPage('/');

			 $timeout(reloadPage, 500);

    	};

    	$scope.goToPage = function(path){
		$location.path(path);
		
	};
		
		$scope.inSetup = function () {
			var theLocation = locationService.getLocation();
			var isInSetup = true;
			if (theLocation == '/setup') {
				isInSetup = true;
			};
			return isInSetup;
		};

		$scope.hideNavbar = function(){
			var theLocation = locationService.getLocation();
			//console.log(theLocation);
			var x = "/schedule/";
			var hideBar = false;
			if (theLocation.substring(0, x.length) === x) {
				hideBar = true;
			};
			return hideBar;
		};

		function reloadPage () {
  			$window.location.reload();
  		};


    	function LogItOut (){
    		$scope.$apply( function() {
			    	$location.path('/');
			     	});
    		$route.reload();
    	};

    	$scope.isActive = function (viewLocation) { 
        	return viewLocation === $location.path();
    	};

    	$scope.isLoggedIn = function (){
    		var loggedIn = false;
    		if (currentUser) {
    			loggedIn = true;
    		};

    		return loggedIn;
    	};


    	var Message = Parse.Object.extend("Message");
		var query = new Parse.Query(Message);
		query.find({
		  success: function(results) {
		    for (var i = results.length - 1; i >= 0; i--) {
		    	var secString = results[i].get('duration');
		    	if (secString == undefined) {

		    	} else {
		    		var secs = parseFloat( results[i].get('duration') );
		    		addTheMinutes(secs);
		    	};
		    };
		  },
		  error: function(error) {
		    alert("Error: " + error.code + " " + error.message);
		  }
		});

		var allSeconds = 0;
		function addTheMinutes(num) {
			allSeconds = allSeconds + num;
			$scope.totalMins = Math.round(allSeconds / 60);
			$scope.$apply();
		};

		$scope.theDuration;
		
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

		function getRecordings (){
			var thou;
			var hund;
			var extraZero;
			console.log('trying to get the recording minutes');
			Parse.Cloud.run('getTotalRecordings', {
      		 "type": "total"
    		}, {
    			success: function(result) {
    					var total = 0;
						$.each(result, function () {
						    total += (this / 60);
						});
    				total = Math.floor(total);
    				var processedNumber = numberWithCommas(total);
    				$scope.theDuration = processedNumber;
    				$scope.$apply();

    				
    		},
			    error: function(error) {
			      console.log(error);
			    }
  			});
		};
		
		getRecordings();

		$scope.scrollTo = function(id) {
		    $location.hash(id);
		    console.log($location.hash());
		    $anchorScroll();
		  };

  }]);