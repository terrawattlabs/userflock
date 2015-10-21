ufApp.controller('ScheduleCtrl', 
    ['$scope', '$location', '$modal', '$log', 'growl', '$compile', 'uiCalendarConfig', '$routeParams', 
    function ($scope, $location, $modal, $log, growl, $compile, uiCalendarConfig, $routeParams) {
    
    // determine client's current zone  
    var z = jstz.determine();
    var clientZone = z.name();
 
    
$scope.slotLimit = 4;
$scope.showMore = function (){
  $scope.slotLimit = $scope.slotLimit + 5;
  $scope.apply();
};

var calendarID = parseFloat($routeParams.calID);

var companyName;
// find the user with this calendar
var CalendarSettings = Parse.Object.extend("CalendarSettings");
var query = new Parse.Query(CalendarSettings);
query.equalTo("CalendarNumber", calendarID);
query.find({
  success: function(results) {
    findCustomer(results[0].get('User').id);
    companyName = results[0].get('companyName');
    $scope.imgURL = results[0].get('companyLogo').url();
  },
  error: function(error) {
    alert("Error: " + error.code + " " + error.message);
  }
});

$scope.cust_name;
$scope.cust_email;

function findCustomer (id) {
  var User = Parse.Object.extend("User");
  var query = new Parse.Query(User);
  query.get(id, {
    success: function(user) {
      $scope.cust_email = user.get('email');
      $scope.cust_name = user.get('name');
      $scope.cust_phone = user.get('number');
    },
    error: function(object, error) {
      // The object was not retrieved successfully.
      // error is a Parse.Error with an error code and message.
    }
  });
};

    var today = new Date();
    var day = today.getDate();
    var month = today.getMonth();
    var year = today.getFullYear();
    var hours = today.getHours();
    var minutes = today.getMinutes();
    var numDays = daysInMonth(today.getMonth(),year);
    var daysLeft = numDays - day;
    var monthAdd = 0;
    var setDays;
    var yearAdd = 0;

    console.log(month);

    if (daysLeft < 7) {
      monthAdd = 1;
      setDays = 7 - daysLeft + 1;
      if (month == 11) {
        yearAdd = 1;
      };

    } else {
      monthAdd = 0;
      setDays = day + 7;
    };

    var toDate = new Date();
    toDate.setMonth(month + monthAdd)
    toDate.setDate(setDays);
    toDate.setYear(year + yearAdd);
    console.log(toDate);

    var finalDate;
    if (setDays < 10) {
      finalDate = "0" + setDays;
    };

    var finalYear = year + yearAdd;
    var finalMonth = month + monthAdd;

    if (finalMonth < 10) {
      finalMonth = "0" + finalMonth;
    };


// simple pull next 15 days of slots

var simpleToday = new Date();
var currentDate = simpleToday.getDate();
var simpleToDate = new Date();
var dateAdder = currentDate + 15;
simpleToDate.setDate(dateAdder);
console.log(currentDate);

var mm = simpleToDate.getMonth() + 1;
if (mm < 10) {
  mm = "0" + mm;
};

var dd = simpleToDate.getDate();
if (dd < 10) {
  dd = "0" + dd;
};
var yyyy = simpleToDate.getFullYear();

var formattedToDate = yyyy + "-"+ mm + "-" + dd;


    

    $scope.pullSlots = function (){

      console.log('tried to pull slots');
      console.log($routeParams.calID);
      console.log(500);
      var calNumber = parseFloat($routeParams.calID);
     Parse.Cloud.run('pullSlots', {
           "calID": calNumber,
           "toDate": formattedToDate
        }, {
          success: function(result) {
            console.log(result);
            var data = $.parseJSON(result);
            console.log(data.length);
            $scope.blocks = data;
            handleTimeZone(data);
            
            //$scope.$apply();

        },
          error: function(error) {
            console.log(error);
          }
        });

  };

$scope.testBlocks;

  function handleTimeZone(d) {
    for (var i =0;  i <= d.length - 1; i++) {
     var sl = d[i].slot;
     var m = moment(sl['timestamp']);
     var mz = m.clone().tz(clientZone);
     var mzf = mz.format('llll');
     $scope.blocks[i].slot['userTime'] = mzf;
     $scope.blocks[i].slot['userTimeZone'] = mz.format('llll z');
     
    };
    console.log($scope.blocks);
  };


  function daysInMonth(month,year) {
    return new Date(year, month, 0).getDate();
    };

  $scope.pullSlots();

 $scope.selected = function (b) {
  $scope.chosenTimeObj = $scope.blocks[b].slot;
  $scope.chosenTimeFormat = $scope.chosenTimeObj["userTime"];
  $scope.chosenTimeFormatZone = $scope.chosenTimeObj["userTimeZone"];
  console.log(b);
  $scope.isSelected = true;
  $scope.timeSelectCollapse = true;
  $scope.inputFormCollapse = false;

 };

 $scope.isSelected = false;
 $scope.showSuccess = false;
 $scope.inProcess = true;
 $scope.showInfo = false;

 $scope.showInfoBox = function (){
  $scope.showInfo = true;
 };

  $scope.showConfirm = function (){

    return $scope.isSelected;
  };

  $scope.bookSlot = function (){
    var bookStart = $scope.chosenTimeObj["timestamp"];
    var bookEnd = $scope.chosenTimeObj["timestamp_end"];
    console.log(bookStart);
    console.log(bookEnd);
    $scope.submitButton =true;

      Parse.Cloud.run('createBooking', {
           "calID": $routeParams.calID,
           "bookedFrom": bookStart,
           "bookedTo": bookEnd
        }, {
          success: function(result) {
            $scope.inputFormCollapse = true;
            console.log(result);
            var data = $.parseJSON(result);
            greatSuccess(data);
            $scope.$apply();

        },
          error: function(error) {
            console.log(error);
          }
        });

  };

$scope.submitButton = false;

  function greatSuccess(dt){
    $scope.isSelected = false;
    $scope.showSuccess = true;
    $scope.inProcess = false;
    $scope.showInfo = false;

    var bookedDateStart = $scope.chosenTimeFormatZone;

    //variables for the email sending
    // send Userflock Customer an Email
    Parse.Cloud.run('sendEmail', {
            "recipient": $scope.cust_email,
            "sender": "hello@userflock.com",
            "subject": "You've Got a New Interview Scheduled with " + $scope.user_name,
            "bodyHTML": "<p>Hi " + $scope.cust_name + ",</p>" + 
            "<p>You've got an interview with one of your customers.</p>" +
            "<ul>" +
            "<li><strong>Name:</strong> " + $scope.user_name + "</li>" +
            "<li><strong>Email:</strong> " + $scope.user_email + "</li>"+
            "<li><strong>Date / Time:</strong> " + bookedDateStart + "</li>" +
            "<li><strong>They added some notes:</strong> " + $scope.user_notes + "</li>" +
            "</ul>" +
            "<p>Thanks!</p>" +
            "<p>The UserFlock Team!</p>"

        }, {
          success: function(result) {
            // console.log(result);
        
        },
          error: function(error) {
            // console.log(error);
          }
        });


// google calendar link format

// https://www.google.com/calendar/render?action=TEMPLATE&text=Summary%20of%20the%20event&dates=20150807T090000/20150807T110000&ctz=America/New_York&details=Description%20of%20the%20event&location=Location%20of%20the%20event&pli=1&uid=&sf=true&output=xml#eventpage_6

    // send End User an Email
    Parse.Cloud.run('sendEmail', {
            "recipient": $scope.user_email,
            "sender": "hello@userflock.com",
            "subject": "You've Scheduled an Interview with " + $scope.cust_name,
            "bodyHTML": "<p>Hi " + $scope.user_name + ",</p>" + 
            "<p>You've scheduled interviews with " + $scope.cust_name + " at " + bookedDateStart + "</p>" +
            "<p>At that time, just call this phone number: " + $scope.cust_phone +
            "<p>If you have any questions you can email them at: " + $scope.cust_email + "</p>" +
            "<p>Thanks!</p>" +
            "<p>The UserFlock Team!</p>"

        }, {
          success: function(result) {
            // console.log(result);
        
        },
          error: function(error) {
            // console.log(error);
          }
        });
  };

// var CalendarSettings = Parse.Object.extend("CalendarSettings");
// var query = new Parse.Query(CalendarSettings);
// query.equalTo("CalendarNumber", calendarID);
// query.find({
//   success: function(cal) {
    
//     findCustomer(cal[0].get('User'));
//   },
//   error: function(object, error) {
//     // The object was not retrieved successfully.
//     // error is a Parse.Error with an error code and message.
//   }
// });

$scope.timeSelectCollapse = false;
$scope.inputFormCollapse = true;

$scope.changeCollapse = function(){
  $scope.timeSelectCollapse = !$scope.timeSelectCollapse;
  $scope.inputFormCollapse = !$scope.inputFormCollapse;
};

  }]);





