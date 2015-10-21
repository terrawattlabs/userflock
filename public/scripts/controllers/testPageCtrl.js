ufApp.controller('TestpageCtrl', 
    ['$scope', '$timeout', '$routeParams', 'growl', '$modal', '$log', '$http', 'TimerService',
    function ($scope, $timeout, $routeParams, growl, $modal, $log, $http, TimerService) {
      var currentUser = Parse.User.current();
      

    var today = new Date();

    var year = today.getFullYear();
    var month = addZero(today.getMonth() + 1);
    var date = addZero(today.getDate());
    var hours = addZero(today.getHours());
    var min = addZero(today.getMinutes());
    var zone = today.getTimezoneOffset();

    console.log(zone);


   function addZero (raw){
      if (raw<10) {
        raw = "0" + raw;
      };
      return raw
   };

   $scope.end = "foo";

   var startTime = year + month + date + "T" + hours + min + "00" + zone;
   console.log(startTime);


   $scope.url = "&text=Interview+Second+Word&dates=" + startTime + "/20140320T221500Z&details=Your+phone+call+will+be+with+Jack+Dean+if+you+have+any+questions+please+email+them+at+email@email.com&sf=true&output=xml";




    }]);



// 20150807T1819Z
// 20140320T221500Z