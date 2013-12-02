function init() {
	sVM = new contactViewModel();
	ko.applyBindings(sVM);
}

function contactViewModel() {
	var self = this;
	
	self.selectedContact = ko.observable({});
	self.contactUpdating = ko.observable(false);
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

	self.showUpdateForm = function(){
		self.contactUpdating(true);
		$("#editIcon").hide();
		$("#contactDisplay").hide();
	};
	
	self.hideIcon = function(){
		$("#editIcon").hide();
	};
	
	self.showIcon = function(){
		if(self.contactUpdating() === false)
			$("#editIcon").show();
		else
			$("#editIcon").hide();
	};
	
	self.cancel = function(){
		self.contactUpdating(false);
		$("#contactDisplay").show();
		$("#editIcon").show();
	};
	
	self.update = function(contact) {
		$("#profilePassword").trigger("change");
		contact.Password = $("#profilePassword").val();
		
		if ((true === /^[\*]+$/.test(contact["Password"])) || contact["Password"] === "" || _.isUndefined(contact["Password"])){
			delete contact["Password"];
		}
		
		//alert(JSON.stringify(contact));
		//return;
		
		$.ajax({
			type : "PUT",
			url : CRM_URL + 'crm/profile/update',
			data : contact
		}).done(function(data) {
			$("#editIcon").show();
			//self.selectedContact(undefined);
			contact["Password"] = whoAmI.Password;
			self.contactUpdating(false);
			$("#contactDisplay").show();
			$("#alertbox").html("" + 
					"<div class='alert alert-block alert-success fade in'>" +
					"<button type='button' class='close' data-dismiss='alert'>&times;</button>" +
					"Success. You may be redirected to login if Email or Password was updated." +
				    "</div>");
			
			self.loadData();
			
			// if email or passowrd was updated, redirect
			if((!_.isUndefined(contact["Password"]) && contact["Password"]) || (whoAmI.Email_Address !== contact["Email_Address"])) {
				location.reload();
			} else if(whoAmI.Name !== contact["Name"]){
				// If Name was was updated, update display Name
				$("#logged_user").html(contact["Name"]);
			}
		});		
	};
	
	self.loadData = function(){
		$.getJSON(CRM_URL + "crm/whoami", function(result) {
			if (result != null) {
				self.selectedContact(result);				
			}
		});
	};
	
	self.loadData();
	
}

$(document).ready(function() {
	initWhoAmI(function(result) {
		if (result != null) {
			whoAmI = result;
		};
		init();
	});
	
//	var pages = ["dashboard", "contact" , "lead", "account", "product" ,"order", "map", "report", "settings"];
//	_.each(pages, function(page){
//		$("#nav-" + page).removeClass("active");
//	});
	$("#nav-settings").addClass("active");
	
});
