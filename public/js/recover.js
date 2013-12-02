var CRM_HOST = "localhost";
var CRM_PORT = "8888";
var CRM_URL = '/api/';

function init() {

	rVM = new recoverViewModel();
	ko.applyBindings(rVM);
}

function recoverViewModel() {
	var self = this;
	
	self.selectedRecover = ko.observable();
	self.selectedContact = ko.observable();

	var baseUri = CRM_URL + 'crm/profile/recover';
	
	self.recover = function(recover) {
		//alert(JSON.stringify(recover));
		$("#btnSend").attr("disabled","disabled");
		$.ajax({
			type : "GET",
			url : baseUri,
			data: recover
		}).done(function(data) {
				$("#recoverFormContainer").remove();
				$("#alertbox").html("" + 
						"<div class='alert alert-block alert-success fade in'>" +
						"<button type='button' class='close' data-dismiss='alert'>&times;</button>" +
						"Password reset link has been emailed. Please check your mail and click <a href='/login'>Login</a> to continue." +
					    "</div>");
				$("#btnSend").removeAttr("disabled");
		}).fail(function(xhr, status, error){
				$("#alertbox").html("" + 
						"<div class='alert alert-block alert-error fade in'>" +
						"<button type='button' class='close' data-dismiss='alert'>&times;</button>" +
						$.parseJSON(xhr.responseText).status +
					    "</div>");
				$("#btnSend").removeAttr("disabled");
		});
	};
	
//	self.update = function(account) {
//		account["token"] = $("#token").val();
//		$.ajax({
//			type : "POST",
//			url : baseUri,
//			data : account,
//		}).done(function(data) {
//				$("#changeFormContainer").remove();
//				$("#alertbox").html("" + 
//						"<div class='alert alert-block alert-success fade in'>" +
//						"<button type='button' class='close' data-dismiss='alert'>&times;</button>" +
//						"Password updated. You may now <a href='/login'>Login</a> to continue." +
//					    "</div>");
//		}).fail(function(xhr, status, error){
//				$("#alertbox").html("" + 
//						"<div class='alert alert-block alert-error fade in'>" +
//						"<button type='button' class='close' data-dismiss='alert'>&times;</button>" +
//						$.parseJSON(xhr.responseText).status +
//					    "</div>");
//		});
//	}
	
	self.init = function(){
		self.selectedRecover({});
		self.selectedContact({});
	};
	
	self.init();
}

$(document).ready(function() {
	init();
});