function init() {
	iVM = new contactViewModel();
	ko.applyBindings(iVM);
}

function contactViewModel() {
	var self = this;

	self.selectedInvitee = ko.observable();
	
	//var baseUri = CRM_URL + 'contact/';
	
	self.invite = function(){
		$("#btnInvite").attr("disabled", "disabled");
		
		$("#inviteContact").hide();
		$("#invitealert").html("Please Wait ...");
		$.getJSON( CRM_URL + "crm/profile/invite/" + self.selectedInvitee() + "/", function(result) {
			$("#invitealert").html("" + 
					"<div class='alert alert-block alert-success fade in'>" +
					"<button type='button' class='close' data-dismiss='alert'>&times;</button>" +
					"Your invitation has been sent." +
				    "</div>");
			self.selectedInvitee(undefined);
			$("#inviteContact").show();
			$("#btnInvite").removeAttr("disabled");
		}).error(function(xhr, status, error){
			$("#invitealert").html("" + 
					"<div class='alert alert-block alert-error fade in'>" +
					"<button type='button' class='close' data-dismiss='alert'>&times;</button>" +
					$.parseJSON(xhr.responseText).status +
				    "</div>");
			$("#btnInvite").removeAttr("disabled");
		});
	};
	
}

$(document).ready(function() {
	initWhoAmI(function(result) {
		if (result != null) {
			whoAmI = result;
		};
		init();
	});
	
	$("#nav-settings").addClass("active");
	
});