var CRM_HOST = "localhost";
var CRM_PORT = "8888";
var CRM_URL = '/api/';

function init() {

	rVM = new registerViewModel();
	ko.applyBindings(rVM);
}

function registerViewModel() {
	var self = this;
	self.ENABLE_REGISTRATION = true;
	
	self.selectedContact = ko.observable(undefined);

	var baseUri = CRM_URL + 'crm/profile/add';
	
	self.create = function(register) {
		$("#btnCreate").attr("disabled","disabled");
		register.Password = register.Password || $("#password").val();
		
		$.ajax({
			type : "POST",
			url : baseUri,
			data : register,
		}).done(function(data) {
				$("#registrationForm").remove();
				$("#alertbox").html("" + 
						"<div class='alert alert-block alert-success fade in'>" +
						"<button type='button' class='close' data-dismiss='alert'>&times;</button>" +
						"Thank you for registering. A verification mail has been sent." +
					    "</div>");
				$("#btnCreate").removeAttr("disabled");
		}).fail(function(err){
			$("#alertbox").html("" + 
					"<div class='alert alert-block alert-error fade in'>" +
					"<button type='button' class='close' data-dismiss='alert'>&times;</button>" +
					"There was an error creating the account. Please try again." +
				    "</div>");
			$("#btnCreate").removeAttr("disabled");
		});
	};
	
	self.cancel = function(){
		self.selectedContact(undefined);
		window.location = CRM_URL + 'login';
	};
	
	self.init = function(){
		var contact = {};
		self.selectedContact(contact);
	};
	
	self.init();
}

$(document).ready(function() {
	init();
});