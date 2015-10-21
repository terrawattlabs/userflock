ufApp.service("TimerService", function (){

	var callTime;
	var formattedTime;

	return {
		postTime: function(t) {
			callTime = t;
			return callTime;
		},
		postFormattedTime: function(v){
			formattedTime = v;
			return formattedTime;
		},
		getFormattedTime: function(){
			return formattedTime;
		},
		getSeconds: function(){
			return callTime;
		}
	}
});