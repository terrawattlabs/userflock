ufApp.controller('AvailabilityCtrl', 
    ['$scope', '$location', '$modal', '$log', 'growl', '$compile', 'uiCalendarConfig', 
    function ($scope, $location, $modal, $log, growl, $compile, uiCalendarConfig) {
      var currentUser = Parse.User.current();
      var userCalendarID;

      var z = jstz.determine();
      var clientZone = z.name();
      var today = moment();
      var todayYear = today.year();
      var todayMonth = today.month() + 1;
      var todayDate = today.date();
      var todayString = todayYear + "-" + todayMonth + "-" + todayDate;

      $scope.testing = todayString;

      $scope.currentZone = moment.tz(todayString, "America/New_York").format();

    var startTime = new Date();
  startTime.setHours(9);
  startTime.setMinutes(0);

  var endTime = new Date();
  endTime.setHours(17);
  endTime.setMinutes(0);

  $scope.mondayStart = startTime;
  $scope.mondayEnd = endTime;


      var CalendarSettings = Parse.Object.extend("CalendarSettings");
      var query = new Parse.Query(CalendarSettings);
      query.equalTo("User", currentUser);
      query.find({
        success: function(results) {
          getCalendar(results[0].get('CalendarNumber'));
        },
        error: function(error) {
          alert("Error: " + error.code + " " + error.message);
        }
      });

      function getCalendar (calid) {
        console.log(calid);
        Parse.Cloud.run('pullCalendar', {
           "calID": calid
        }, {
          success: function(result) {
            console.log(result);
            var data = $.parseJSON(result);
            userCalendarID = data.resource['id'];
            $scope.userCalendarID = userCalendarID;
            //console.log(data.resource.opening_hours_mon[0]);
            handleTimes(data.resource);

        },
          error: function(error) {
            console.log(error);
          }
        });

      };

$scope.availObj = [
  {name: "Monday", times: []},
  {name: "Tuesday", times: []},
  {name: "Wednesday", times: []},
  {name: "Thursday", times: []},
  {name: "Friday", times: []},
  {name: "Saturday", times: []},
  {name: "Sunday", times: []}
];

$scope.noAvail = [];

$scope.changeAvail = function (x){
  var a = moment().hour(9);
  a.minute(0);
  var b = moment().hour(17);
  b.minute(0);
  if ($scope.noAvail[x] == true) {
    $scope.availObj[x].times = [];
  } if ($scope.noAvail[x] == false) {
    $scope.availObj[x].times.push(a);
    $scope.availObj[x].times.push(b);
  };
};



function handleTimes (dt){
  var dataObj =[];

  dataObj.push(dt.opening_hours_mon);
  dataObj.push(dt.opening_hours_tue);
  dataObj.push(dt.opening_hours_wed);
  dataObj.push(dt.opening_hours_thu);
  dataObj.push(dt.opening_hours_fri);
  dataObj.push(dt.opening_hours_sat);
  dataObj.push(dt.opening_hours_sun);

  console.log('this is the data object');
  console.log(dataObj);



  // var monRaw = dt.opening_hours_mon;
  // var tuesRaw = dt.opening_hours_tue;
  // var wedRaw = dt.opening_hours_wed;
  // var thuRaw = dt.opening_hours_thu;
  // var friRaw = dt.opening_hours_fri;
  // var satRaw = dt.opening_hours_sat;
  // var sunRaw = dt.opening_hours_sun;

  //console.log("Tuesday Raw : " + tuesRaw);

  //console.log(dt);

  for (var x = 0; x <= dataObj.length - 1; x++) {
    var item = dataObj[x];
    if (item == null) {
      $scope.availObj[x].times =[];
      $scope.noAvail[x] = true;
    } else {
      if (item.length == 0) {
        console.log('no availability here ');
      };
      //console.log(item.length);

      for (var i = 0 ; i <= item.length - 1; i++) {

        // convert input data from Eastern time to user's current timezone
        var fullToday = todayString + " " + item[i];
        var m = moment.tz(fullToday, "America/New_York");
        var mz = m.clone().tz(clientZone);



        $scope.availObj[x].times.push(mz);


      };
    };
  };

};

  

  $scope.hstep = 1;
  $scope.mstep = 15;

  $scope.options = {
    hstep: [1, 2, 3],
    mstep: [1, 5, 10, 15, 25, 30]
  };

  $scope.ismeridian = true;
  $scope.toggleMode = function() {
    $scope.ismeridian = ! $scope.ismeridian;
  };

  $scope.update = function() {
    var d = new Date();
    d.setHours( 14 );
    d.setMinutes( 0 );
    $scope.mytime = d;
  };

  var processedTimes = [];

  var monday = [];
  var tuesday = [];
  var wednesday = [];
  var thursday = [];
  var friday = [];
  var saturday = [];
  var sunday = [];

  $scope.monday = [];
  $scope.mondayProcessed =[];


  $scope.addFrame = function (day, index){
    console.log(day);
    var today = new Date();
    var today2 = new Date();
    var last = $scope.monday[index];
    var last2 = $scope.monday[index];
    var lasthr = last.getHours();
    var last2hr = last2.getHours();
    console.log(last2hr);
    var nowHours = today2.getHours();

    var next = last.setHours(lasthr);
    var second = last2.setHours(last2hr + 1);
    var next2 = today2.setHours(nowHours + 1);
    console.log("next is - " + next);
    console.log("today is - " + today);
    $scope.monday.push(next);
    //$scope.monday.push(today);
    console.log($scope.monday);
    //$scope.changed();
    
  };

  $scope.changed = function () {
    processedTimes = [];
   for (var i = 0; i <= $scope.availObj.length - 1; i++) {
     //console.log($scope.availObj[i].times.length);
     var tempArray = [];
     for (var x = 0; x <= $scope.availObj[i].times.length-1; x++) {

        var raw = moment($scope.availObj[i].times[x]);
        var tzshift = raw.clone().tz('America/New_York');

        var hh = tzshift.hour();
        var mm = tzshift.minute();

        if (mm <10) {
          mm = "0" + mm;
        };


        var compile = hh + ":" + mm;

        tempArray.push(compile);
     
     };
      processedTimes.push(tempArray);
      console.log('pushed array');
     };

     console.log(processedTimes);
  };

  $scope.clear = function() {
    $scope.mytime = null;
  };

  function processTime(data){
    //console.log(data.length);
    $scope.mondayProcessed = [];
      for (var i = 0 ; i < data.length; i++) {
        //console.log(data[i]);
        var hours = data[i].getHours()
        var min = data[i].getMinutes();
        if (min == 0) {
          min = "00"
        };
        var readable = hours + ":" + min;
        //console.log(readable);
        
        $scope.mondayProcessed.push(readable);
      };
   
  };


  $scope.saveAvailability = function (){
    $scope.changed();


     Parse.Cloud.run('updateCalendar', {
           "calID": userCalendarID,
           "mon_hours": processedTimes[0],
           "tues_hours": processedTimes[1],
           "wed_hours": processedTimes[2],
           "thu_hours": processedTimes[3],
           "fri_hours": processedTimes[4],
           "sat_hours": processedTimes[5],
           "sun_hours": processedTimes[6]
        }, {
          success: function(result) {
            console.log(result);
            growl.addSuccessMessage("Availability Saved!");
        },
          error: function(error) {
            console.log(error);
          }
        });
  };


// new design codes



$scope.addTime = function (pi, i){
  var newStartTime = $scope.availObj[pi].times[i] +1;
  var newEndTime = newStartTime + 1;

  $scope.availObj[pi].times.push(newStartTime, newEndTime);
  };


  }]);




