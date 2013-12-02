var CRM_HOST = "localhost";
var CRM_PORT = "8888";
var CRM_URL = '/api/';

function init() {

	vVM = new verifyViewModel();
	ko.applyBindings(vVM);
}

function verifyViewModel() {
	var self = this;
	
	self.selectedToken = ko.observable();

	var baseUri = CRM_URL + 'crm/profile/verify';
	
	self.verify = function(verify) {
		$("#btnVerify").attr("disabled","disabled");
		$.ajax({
			type : "GET",
			url : baseUri,
			data : verify
		}).done(function(data) {
				$("#verifyFormContainer").remove();
				$("#alertbox").html("" + 
						"<div class='alert alert-block alert-success fade in'>" +
						"<button type='button' class='close' data-dismiss='alert'>&times;</button>" +
						"Thank you. You may now proceed to <a href='login'>Log In</a>" +
					    "</div>");
				$("#btnVerify").removeAttr("disabled");
		}).fail(function(xhr, status, error){
			$("#alertbox").html("" + 
					"<div class='alert alert-block alert-error fade in'>" +
					"<button type='button' class='close' data-dismiss='alert'>&times;</button>" +
					$.parseJSON(xhr.responseText).status +
				    "</div>");
			$("#btnVerify").removeAttr("disabled");
		});
	};

	self.init = function(){
		self.selectedToken({});
	};
	
	self.init();
	
}

$(document).ready(function() {
	init();
});