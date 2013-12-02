var whoAmI = null;
var identity = null;

var CRM_HOST = "localhost";
var CRM_PORT = "8888";
//var CRM_HOST = "localhost";

//var CRM_URL = 'http://' + CRM_HOST + ':' + CRM_PORT + '/';
var CRM_URL = '/api/';

var initWhoAmI = function(callback) {
	$.getJSON(CRM_URL + "crm/whoami", function(result) {
		if(!_.isUndefined(result.isManager)) {
			if(parseInt(result.isManager) === 1) {
				$("#nav-team").show();
				$("#nav-product").show();
			}
		}
		if (typeof callback === 'function') {
			return callback(result);
		}
	});
}

$(document).ready(function() {
	
	//initialize();
	
	$.ajax({cache: false});
	
	/*$.ajax({
		statusCode: {
			404: function() {
				alert("page not found");
			}
		}
	});*/	
	
	var pages = ["dashboard", "contact", "team", "lead", "account", "product" ,"order", "report", "profile"];
	
	$.ajaxSetup({ cache: true }); // enable cache
	
	/************ Section: Terminate Incomplete Ajax Requests ************/
	$.xhrPool = []; // array of uncompleted requests
	$.xhrPool.abortAll = function() { // our abort function
	    $(this).each(function(idx, jqXHR) {
	        jqXHR.abort();
	    });
	    $.xhrPool.length = 0;
	};

	$.ajaxSetup({
	    beforeSend: function(jqXHR) { // before jQuery send the request we will push it to our array
	        $.xhrPool.push(jqXHR);
	    },
	    complete: function(jqXHR) { // when some of the requests completed it will splice from the array
	        var index = $.xhrPool.indexOf(jqXHR);
	        if (index > -1) {
	            $.xhrPool.splice(index, 1);
	        }
	    }
	});
	/************ Section: Terminate Incomplete Ajax Requests ************/
	
});