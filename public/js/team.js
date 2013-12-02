function init() {
	cVM = new contactViewModel();
	ko.applyBindings(cVM);
}

function nl2br (str, is_xhtml) {
    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}

function showMsg(msg, success) {
	var headerText = "<div class='alert alert-block alert-error fade in'>";
	if(success) headerText = "<div class='alert alert-block alert-success fade in'>";
	
	$("#alertbox").html(headerText +
			"<button type='button' class='close' data-dismiss='alert'>&times;</button>" +
			msg +
		    "</div>");
	
	location.hash = "#alertbox";
}

function contactViewModel() {
	var self = this;
	self.contacts = ko.observableArray();
	self.ajaxErrors = ko.observable();
	self.displayingInfo = ko.observable(false);
	self.loadingContactList = ko.observable(true);
	self.contactUpdating = ko.observable(false);
	self.selectedContact = ko.observable();
	self.selectedContactType = ko.observable();
	self.selectedContactAction = ko.observable();
	
	self.selectedLead = ko.observable();
	self.selectedTask = ko.observable();
	self.taskUpdating = ko.observable(false);
	self.membersUpdating = ko.observable(false);
	self.sendingMessage = ko.observable(false);
	self.sendingAnnouncement = ko.observable(false);
	
	self.selectedSubscriber = ko.observable();
	self.selectedMessage = ko.observable({});
	
	self.availableCompanyContacts = ko.observableArray([]);
	self.selectedCompanyContacts = ko.observableArray([]);
	self.availableAssignedMembers = ko.observableArray([]);
	self.selectedAssignedMembers = ko.observableArray([]);
	
	self.search = ko.observable("");
	
	var baseUri = CRM_URL + 'contact/';
	
	/********* Pagination Code ************/
    self.pageSize = ko.observable(10);
    self.pageIndex = ko.observable(0);
 
    self.pagedList = ko.dependentObservable(function () {
        var size = self.pageSize();
        var start = self.pageIndex() * size;
        
        if (self.search()) {
        	return _(_.filter(self.contacts(), function(item){
        		return ~(item.Name.toLowerCase().indexOf(self.search().toLowerCase()));
        	}).slice(start, start + size)).sortBy('Name');
        }
        else return _(self.contacts.slice(start, start + size)).sortBy('Name');
    });
    self.maxPageIndex = ko.dependentObservable(function () {
    	if (self.search()) {
    		return Math.ceil(_.filter(self.contacts(), function(item){
        		return ~(item.Name.toLowerCase().indexOf(self.search().toLowerCase()));
        	}).length/self.pageSize())-1;
    	}
        return Math.ceil(self.contacts().length/self.pageSize())-1;
    });
    self.previousPage = function () {
        if (self.pageIndex() > 0) {
            self.pageIndex(self.pageIndex() - 1);
        }
    };
    self.nextPage = function () {
        if (self.pageIndex() < self.maxPageIndex()) {
            self.pageIndex(self.pageIndex() + 1);
        }
    };
    self.allPages = ko.dependentObservable(function () {
        var pages = [];
        for (var i=0; i <= self.maxPageIndex() ; i++) {
            pages.push({ pageNumber: (i + 1) });
        }
        return pages;
    });
    self.moveToPage = function (index) {
        self.pageIndex(index);
    };	

    self.search.subscribe(function() {
    	self.pageIndex(0);
    });
    /********* End of Pagination Code ************/
        
    self.resetAll = function(){
		self.selectedLead(undefined);
		
		self.taskUpdating(false);
		self.selectedTask(undefined);
	
    	self.contactUpdating(false);
    	self.membersUpdating(false);
    	self.sendingMessage(false);
    	self.sendingAnnouncement(false);
    	
    	self.availableCompanyContacts([]);
    	self.selectedCompanyContacts([]);
    	self.availableAssignedMembers([]);
    	self.selectedAssignedMembers([]);
		
    	self.selectedMessage({});
		self.selectedContactAction(undefined);
    };
    
    self.showAnnounce = function(){
    	self.sendingAnnouncement(true);
    };
    
    self.cancelAnnounce = function(){
		self.resetAll();
		
		self.displayingInfo(true);
    };
    
    
    self.addTask = function(){
		var task = {
				//"Created" : ((new Date()).getFullYear()) + '-' + ('0' + ((new Date()).getMonth() + 1)).substr(-2, 2) + '-' + ('0' + (new Date()).getDate()).substr(-2, 2),
				//"Deadline" : ((new Date()).getFullYear()) + '-' + ('0' + ((new Date()).getMonth() + 1)).substr(-2, 2) + '-' + ('0' + (new Date()).getDate()).substr(-2, 2),
				//"Priority" : "Medium",
				"Description" : "",
				"Related_To" : self.selectedContact().Contact_Id,
				"Related_Name" : self.selectedContact().Name,
				//"Assigner_Id": whoAmI.Contact_Id,
				//"Status" : "Not Started"
		};
		
		self.resetAll();
		
		$("#contactDetails").html("");
		self.displayingInfo(false);
		self.selectedTask(task);
		self.taskUpdating(true);
		self.displayingInfo(false);
    	
    };
    
    self.createTask = function(task){
		$.ajax({
			type : "POST",
			url : CRM_URL + 'task/add',
			data : task
		}).done(function(){
			showMsg(self.selectedContact().Name +" has been added to Task.", true);
			self.cancelTask();
			self.loadData();
		});
    };
    
	self.cancelTask= function(){
		self.resetAll();
		
		self.displayingInfo(true);
	};
	
	self.cancelMembers = function(){
		self.resetAll();
		
		self.displayingInfo(true);
	};
	
	self.updateMembers = function(){
		var updatedMemberIds = _.pluck(self.availableAssignedMembers(), "Contact_Id");
		//alert(JSON.stringify(updatedMemberIds));
		$.ajax({
			type : "POST",
			url : baseUri + 'account/' + self.selectedContact().Contact_Id + '/add',
			data : { Members: updatedMemberIds },
			dataType: 'json',
	        async: false
		}).done(function(){
			showMsg(JSON.stringify(_.pluck(self.availableAssignedMembers(), "Name")) +" have been assigned as members for " + self.selectedContact().Name + ".", true);
			self.showMembers();
		}).error(function(){
			showMsg("An error occurred.", false);
		});
		
	};
	
	self.showMembers = function(){
		self.resetAll();
		
		// Load Subscribed Accounts
		$.getJSON(baseUri + "account/" + self.selectedContact().Contact_Id + "/company", function(subscribedAccounts){
			if(subscribedAccounts)
				self.availableAssignedMembers(subscribedAccounts);
			
			var memberIds = _.pluck(self.availableAssignedMembers(), "Contact_Id");
			
			self.availableCompanyContacts(
				_.filter(self.contacts(),function(contact) { 
					if ((_.contains(memberIds, contact.Contact_Id)) || contact.Contact_Id === self.selectedContact().Contact_Id)
						return false; 
					else
						return true;  
					})
			);
			
			$("#assignedMembers").html("Assigned to " + self.selectedContact().Name);
			self.membersUpdating(true);
		});
		
	};
	
	self.moveMembersRight = function(){
		self.availableAssignedMembers(_.union(self.availableAssignedMembers(), self.selectedCompanyContacts()));
		self.availableCompanyContacts(_.difference(self.availableCompanyContacts(), self.selectedCompanyContacts()));

	};
	
	self.moveMembersLeft = function(){
		self.availableCompanyContacts(_.union(self.availableCompanyContacts(), self.selectedAssignedMembers()));
		self.availableAssignedMembers(_.difference(self.availableAssignedMembers(), self.selectedAssignedMembers()));
	};
	
	self.showMessage = function(){
		self.sendingMessage(true);
		self.selectedMessage({});
	};
	
	self.cancelMessage = function(){
		self.resetAll();
		self.displayingInfo(true);
	};
	
	self.sendMessage = function(message){
		$.ajax({
			type : "GET",
			url : baseUri + 'account/' + self.selectedContact().Contact_Id + '/send',
			data : message
		}).done(function(){
			self.loadData();
			showMsg("Message Sent.", true);
			
			self.resetAll();
			self.displayingInfo(true);
			
		}).fail(function(xhr, status, error){
			showMsg($.parseJSON(xhr.responseText).status,false);
			
			self.resetAll();
			self.selectedMessage({});
		});
	};
    
    self.addContact = function(){
    	var newContact = {};
    	newContact.Category = "Team";
    	
		self.resetAll();

		$("#contactInfo").html("<h3>New Contact</h3>");
    	$("#contactDetails").html("");
    	
		self.selectedContact(newContact);
		
    	self.selectedContactAction("add");
    	self.contactUpdating(true);
		self.displayingInfo(false);
    	
    };
    
    self.updateContact = function(contact){
		self.resetAll();
		
    	self.selectedContactAction("update");
    	self.contactUpdating(true);
		self.displayingInfo(false);
    };
    
    self.cancelContactUpdate = function(){
		self.resetAll();
		
		if (self.selectedContactAction() === "edit") {
			self.displayingInfo(true);
		} else {
			self.selectedContact(undefined);
			self.displayingInfo(false);
		}
    };
    
	self.create = function(contact) {		
		$.ajax({
			type : "POST",
			url : baseUri + 'add',
			data : contact
		}).done(function() {
				self.loadData();
				showMsg(contact.Name +" created.", true);
				
				self.resetAll();
		
				self.selectedContact(undefined);
				$("#contactInfo").html("");
		    	$("#contactDetails").html("");
				self.displayingInfo(false);
		});
	};
	
	self.remove = function() {
		contact = self.selectedContact();
		
		// First remove from the server, then from the view-model.
		var agree = confirm("Are you sure you want to delete this contact?");
		if (agree) {
			$.ajax({
				type : "DELETE",
				url : baseUri + 'account/' + contact.Contact_Id + '/delete'
			}).done(function(){
					self.contacts.remove(contact);
					showMsg(self.selectedContact().Name +" deleted.", true);
					self.loadData();
					
					self.resetAll();
					
					$("#contactInfo").html("");
			    	$("#contactDetails").html("");
					self.displayingInfo(false);
					
			});
		}
	};

	self.update = function(contact) {
		var name = contact.Name;

		$.ajax({
			type : "PUT",
			url : baseUri + 'account/' + contact.Contact_Id + '/update',
			data : contact
		}).done(function(){
			self.loadData();
			//showMsg(name +" updated.", true);
			
			self.resetAll();
			
			$("#contactInfo").html("");
	    	$("#contactDetails").html("");
	    	self.selectedContact(contact);
			self.displayingInfo(true);
		}).fail(function(xhr, status, error){
			showMsg($.parseJSON(xhr.responseText).status,false);
			$("#contactInfo").html("");
	    	$("#contactDetails").html("");
			self.displayingInfo(false);
			
			self.resetAll();
		});		
		
		/*if(!_.isUndefined(contact.isVerified) && (parseInt(whoAmI.isManager) === 0)) {
			showMsg("You do not have rights to verify the contact.", false);
		} else {
			contact.isVerified = parseInt(contact.isVerified);
			

		}*/
	};
	
	self.completeAction = function(){
		if (self.selectedContactAction() === 'add') {
			self.create(self.selectedContact());
			showMsg(self.selectedContact().Name +" added.", true);
		} else if (self.selectedContactAction() === 'update') {
			self.update(self.selectedContact());
			showMsg(self.selectedContact().Name +" updated.", true);
		}
	};
	
	self.makeManager = function(){
		if (whoAmI.isManager) {
			$.ajax({
				type : "PUT",
				url : baseUri + 'account/' + self.selectedContact().Contact_Id + '/manager/set',
				data : null
			}).done(function(){
				showMsg(self.selectedContact().Name +" has been given Manager rights.", true);
				self.selectedContact().isManager = 1;
				self.displayInfo(self.selectedContact());
				self.loadData();
			}).error(function(){
				showMsg("An error occurred.", false);
			});
		}
	};
	
	self.removeManager = function(){
		if (whoAmI.isManager) {
			$.ajax({
				type : "PUT",
				url : baseUri + 'account/' + self.selectedContact().Contact_Id + '/manager/unset',
				data : null
			}).done(function(){
				showMsg(self.selectedContact().Name +"'s Manager rights have been removed.", true);
				self.selectedContact().isManager = 0;
				self.displayInfo(self.selectedContact());
				self.loadData();
			}).error(function(){
				showMsg("An error occurred.", false);
			});
		}
	};
	
	self.contacts.subscribe(function(newValue){
		if (newValue.length > 0){

		}
	});
	
	self.loadData = function(){
		self.loadingContactList(true);
		$.getJSON(baseUri + "company", function(subscribedAccounts){
			// Load Subscribed Accounts
			self.contacts(subscribedAccounts);
			self.loadingContactList(false);
		});
	};

	self.displayInfo = function(contact){
		$("#contactInfo").html("<img src='img/loader.gif'/>");
		
		var contactCompanyName = "";
		var contactName = "";
		if(!_.isUndefined(contact.Company_Name)) contactCompanyName = contact.Company_Name;
		if(!_.isUndefined(contact.Name)) contactName = contact.Name;
		
		var isManager = "";
		if(parseInt(contact.isManager) === 1)
			 isManager = "<small class='label label-important'>Manager</small>";
				 
		$("#contactInfo").html("<h3>" + contactName + " <small>" + contactCompanyName + "</small> " + isManager + "</h3>");		 

		var contactEmail = "N/A";
		var contactPhone = "N/A";
		var contactAddress = "N/A";
		var contactCity = "N/A";
		var contactOptional = "N/A";
		
		if(!_.isUndefined(contact.Email_Address)) contactEmail = contact.Email_Address;
		if(!_.isUndefined(contact.Phone)) contactPhone = contact.Phone;
		
		if(!_.isUndefined(contact.Address)) contactAddress = contact.Address;
		if(!_.isUndefined(contact.City)) contactCity = contact.City;
		if(!_.isUndefined(contact.Optional)) contactOptional = contact.Optional;
		
		$("#contactDetails").html("").html("<br/><span class='contactText'><i class='icon-building icon-large'></i> " + contactAddress + "</span>");
		$("#contactDetails").append("<br/><span class='contactText'><i class='icon-building icon-large'></i> " + contactCity + "</span>");
		
		$("#contactDetails").append("<br/><br/><span class='contactText'><i class='icon-phone icon-large'></i> " + contactPhone + "</span>");
		$("#contactDetails").append("<br/><span class='contactText'><i class='icon-envelope icon-large'></i> " + contactEmail + "</span>");

		$("#contactDetails").append("<br/><br/><span class='contactText'><i class='icon-info-sign icon-large'></i> " + nl2br(contactOptional) + "</span>");
		
		self.resetAll();
		
		self.displayingInfo(true);
		self.contactUpdating(false);
		self.selectedContact(contact);
		self.selectedContactAction(undefined);	
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

	$("#nav-team").addClass("active");
	
	var allContacts = $(".contactname").click(function(){
		allContacts.removeClass("btn-primary");
		$(this).addClass("btn-primary");
	});
	
});