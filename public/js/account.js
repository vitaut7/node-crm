function init() {

	cVM = new contactViewModel();
	ko.applyBindings(cVM);
			
}

function nl2br (str, is_xhtml) {
    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}

function showMsg(msg, success){
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
	
	self.segments = ko.observableArray([]);
	self.categories = ko.observableArray([]);
	self.products = ko.observableArray([]);
	self.selectedSegment = ko.observable();
	self.selectedCategory = ko.observable();
	self.selectedProduct = ko.observable();
	self.selectedOrder = ko.observable();
	self.orderUpdating = ko.observable(false);
	
	self.productSearching = ko.observable(false);
	self.searchProduct = ko.observable();
	
	self.selectedLead = ko.observable();
	self.selectedTask = ko.observable();
	self.leadSources = ["Google","Social Network", "Website", "Email", "Newspaper", "Agent"];
	self.taskUpdating = ko.observable(false);
	self.leadUpdating = ko.observable(false);
	self.contactImporting = ko.observable(false);
	
	self.selectedSubscriber = ko.observable();
	self.selectedImport = ko.observable();
	
	self.search = ko.observable("");
	
	var baseUri = CRM_URL + 'contact/';
	
	self.productList = ko.dependentObservable(function () {
		if(self.searchProduct()) {
//			$('#selectProductName').attr('size', (_.filter(self.products(), function(item){
//        		return ~(item.Product_Name.toLowerCase().indexOf(self.searchProduct().toLowerCase()));
//        	})).length+2);
			//console.log("Searching.." + self.searchProduct());
			return _(_.filter(self.products(), function(item){
        		return ~(item.Product_Name.toLowerCase().indexOf(self.searchProduct().toLowerCase()));
        	})).sortBy("Product_Name");
		} else {
			//$('#selectProductName').attr('size', 1);
			self.productSearching(false);
			return _(self.products()).sortBy("Product_Name");
		}
	});
	
	self.searchProduct.subscribe(function(newValue){
		//alert("Searching: " + newValue);
		if(newValue === "")
			self.productSearching(false);
	});
	
	/********* Pagination Code ************/
    self.pageSize = ko.observable(10);
    self.pageIndex = ko.observable(0);
 
    self.pagedList = ko.dependentObservable(function () {
        var size = self.pageSize();
        var start = self.pageIndex() * size;
        
        if (self.search()) {
        	return _(_.filter(self.contacts(), function(item){
        		return ~(item.Company_Name.toLowerCase().indexOf(self.search().toLowerCase()));
        	}).slice(start, start + size)).sortBy('Company_Name');
        }
        else return _(self.contacts.slice(start, start + size)).sortBy('Company_Name');
    });
    self.maxPageIndex = ko.dependentObservable(function () {
    	if (self.search()) {
    		return Math.ceil(_.filter(self.contacts(), function(item){
        		return ~(item.Company_Name.toLowerCase().indexOf(self.search().toLowerCase()));
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
		self.leadUpdating(false);
		self.selectedLead(undefined);
		
		self.taskUpdating(false);
		self.selectedTask(undefined);
	
		self.segments([]);
		self.categories([]);
		self.products([]);
		self.selectedSegment(undefined);
		self.selectedCategory(undefined);
		self.selectedProduct(undefined);
    	self.selectedOrder(false);
    	
    	self.orderUpdating(false);
    	self.contactUpdating(false);
    	self.contactImporting(false);
    	self.productSearching(false);
		
		self.selectedContactAction(undefined);
    };
    
    self.addTask = function(){
		var task = {
				//"Created" : ((new Date()).getFullYear()) + '-' + ('0' + ((new Date()).getMonth() + 1)).substr(-2, 2) + '-' + ('0' + (new Date()).getDate()).substr(-2, 2),
				//"Deadline" : ((new Date()).getFullYear()) + '-' + ('0' + ((new Date()).getMonth() + 1)).substr(-2, 2) + '-' + ('0' + (new Date()).getDate()).substr(-2, 2),
				//"Priority" : "Medium",
				"Description" : "",
				"Related_To" : self.selectedContact().Contact_Id,
				"Related_Name" : self.selectedContact().Company_Name,
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
    
    self.addLead = function() {
    	var lead = {};
    	lead.Account_Id = self.selectedContact().Contact_Id;
    	lead.Account_Name = self.selectedContact().Company_Name;
    	lead.Lead_Source = "Website";
    	lead.Description = "";
    	
		self.resetAll();
		
		$("#contactDetails").html("");
    	self.displayingInfo(false);
    	self.selectedLead(lead);
    	self.leadUpdating(true);
    };
    
    self.createTask = function(task){
		$.ajax({
			type : "POST",
			url : CRM_URL + 'task/add',
			data : task
		}).done(function(){
			showMsg(self.selectedContact().Company_Name +" has been added to Task.", true);
			self.cancelTask();
			self.loadData();
		});
    };
    
    self.checkPackSizeVisibility = function(){
    		return false;
    };
    
    self.createLead = function(lead){
		// TODO - Add field validation
		$.ajax({
			type : "POST",
			url : CRM_URL + 'lead/add',
			data : lead
		}).done(function(){
			showMsg(self.selectedContact().Company_Name +" has been converted Lead.", true)
			
			self.loadData();
			//loadPage("lead");
			
			self.cancelLead();
		});
    };
    
    
    self.addOrder = function(){
		var contactCompanyName = "";
		var contactName = "";
		if(!_.isUndefined(self.selectedContact().Company_Name)) contactCompanyName = self.selectedContact().Company_Name;
		if(!_.isUndefined(self.selectedContact().Name)) contactName = self.selectedContact().Name;
		
		$("#contactInfo").html("<h3>" + contactCompanyName + " <small>" + contactName + "</small></h3>");
    	
    	var today = ((new Date()).getFullYear()) + '-' + ('0' + ((new Date()).getMonth() + 1)).substr(-2, 2) + '-' + ('0' + (new Date()).getDate()).substr(-2, 2) + " " + (new Date()).getHours() + ":" + (new Date()).getMinutes();
		
    	$("#contactDetails").html("");
    	
		newOrder = {};
		//newOrder.Order_Date = ((new Date()).getFullYear()) + '-' + ('0' + ((new Date()).getMonth() + 1)).substr(-2, 2) + '-' + ('0' + (new Date()).getDate()).substr(-2, 2);
		newOrder.Order_Deadline = newOrder.Order_Date;
		newOrder.Customer_Id = self.selectedContact().Contact_Id;
		newOrder.Quantity = 1;
		newOrder.Description = "";
		newOrder.Optional1 = "";
		newOrder.Status = "New";

		self.resetAll();
		
		self.selectedOrder(newOrder);
		
    	self.orderUpdating(true);
    	$("#contactDetails").html("");
    	self.displayingInfo(false);
    	
		$("#orderContact").html("<small>Order <span class='muted'>" + today +"</span><small>");
    	
		// Load Segments
		$.getJSON(CRM_URL + "product/segment", function(allSegments){
			self.segments(allSegments);
		});
		
    };
    
	self.cancelLead = function(){
		self.resetAll();
		
		self.displayingInfo(true);
	};
	
	self.cancelTask= function(){
		self.resetAll();
		
		self.displayingInfo(true);
	};
	
	self.cancelImport = function(){
		self.resetAll();
		
		self.displayingInfo(true);
	};
    
    self.selectedSegment.subscribe(function(newValue) {
        self.selectedCategory(undefined);
        self.selectedProduct(undefined);
        self.categories([]);
        self.products([]);
        // Load Categories
    	if( (!_.isUndefined(self.selectedSegment())) && (!_.isEmpty(self.selectedSegment())) && (!_.isNull(self.selectedSegment()))){
    		$.getJSON(CRM_URL + "product/segment/" + self.selectedSegment() + "/category", function(allCategories){
    			self.categories(allCategories);
    		});
    	}
    });
    
    self.selectedCategory.subscribe(function(newValue) {
        self.selectedProduct(undefined);
        self.products([]);
        // Load Products
    	if( (!_.isUndefined(self.selectedCategory())) && (!_.isEmpty(self.selectedCategory())) && (!_.isNull(self.selectedCategory()))){
    		$.getJSON(CRM_URL + "product/segment/" + self.selectedSegment() + "/category/" + self.selectedCategory() + "/product", function(allProducts){
    			self.products(allProducts);
    		});
    	}
    });
    
    self.isLubricant = function(){
    	if(self.selectedCategory() === "Lubricants"){
    		return true;
    	} else return false;
    };
    
    self.selectedProduct.subscribe(function(newValue) {
    	// TODO - process order
    	if(!_.isUndefined(self.selectedProduct())) {
    		self.searchProduct(undefined);
    	}
    	
    	var order = self.selectedOrder();
    	if(!_.isUndefined(self.selectedProduct())) {
    		//alert("Product Defined!");
    		order.Product_Id = self.selectedProduct().Product_Id;
    		self.selectedOrder(order);
    	}
    	
    	//Update order
    });
    
    self.addContact = function(){
    	var newContact = {};
    	newContact.Category = "Account";
    	
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
    
    self.cancelOrder = function(){
    	self.resetAll();
    	self.displayingInfo(true);
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
		}).done(function(){
			self.loadData();
			showMsg(contact.Company_Name +" created.", true);
			
			self.resetAll();
	
			self.selectedContact(undefined);
			$("#contactInfo").html("");
	    	$("#contactDetails").html("");
			self.displayingInfo(false);
		});
		
		self.resetAll();
		
		self.displayingInfo(true);
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
				showMsg(self.selectedContact().Company_Name +" deleted.", true);
				self.loadData();
				
				self.resetAll();
				
				$("#contactInfo").html("");
		    	$("#contactDetails").html("");
				self.displayingInfo(false);
			});
		}
	};

	self.update = function(contact) {
		$.ajax({
			type : "PUT",
			url : baseUri + 'account/' + contact.Contact_Id + '/update',
			data : contact
		}).done(function(){
			self.loadData();
			showMsg(name +" updated.", true);
			
			self.resetAll();
			
			$("#contactInfo").html("");
	    	$("#contactDetails").html("");
	    	self.selectedContact(contact);
			self.displayingInfo(true);
		}).fail(function(xhr, status, error){
				showMsg($.parseJSON(xhr.responseText).status,false);
				self.resetAll();
				$("#contactInfo").html("");
		    	$("#contactDetails").html("");
				self.displayingInfo(false);
		});
	};
	
	self.createOrder = function(order) {
		//if(parseInt(order.Quantity) > self.selectedProduct().Max_Order || parseInt(order.Quantity) < self.selectedProduct().Min_Order) {
		//	showMsg("Order quota error! Max Order: " + self.selectedProduct().Max_Order + " Min Order: " + self.selectedProduct().Min_Order, false);
		//} // TODO - Deadline validation
		//else  {
			$.ajax({
				type : "POST",
				url : CRM_URL + 'order/add',
				data : order,
				data : order
			}).done(function(){
				//self.loadData();
				showMsg("Placed new order for " + self.selectedContact().Company_Name, true);
				
				self.selectedOrder(undefined);
				self.selectedProduct(undefined);
			});
	
			self.resetAll();
			
	    	$("#contactInfo").html("");
	    	$("#contactDetails").html("");
			self.displayingInfo(false);		

		//}
	};
	
	
	self.completeAction = function(){
		if (self.selectedContactAction() === 'add')
			self.create(self.selectedContact());
		else if (self.selectedContactAction() === 'update')
			self.update(self.selectedContact());
	};
	
	self.contacts.subscribe(function(newValue){
		if (newValue.length > 0){

		}
	});
	
	self.importContact = function(){
		self.selectedImport({});
		self.contactImporting(true);
		self.displayingInfo(false);
	};
	
	self.uploadImport = function(){
		
		if (!("FormData" in window)) {
			showMsg("This feature is not supported by your browser. Please consider upgrading it.", false);
		} else {
			var fd =new FormData(document.forms.namedItem("importForm"));
			$.ajax({
				  url: baseUri + 'import',
				  type: "POST",
				  data: fd,
				  processData: false,  // tell jQuery not to process the data
				  contentType: false   // tell jQuery not to set contentType
				}).done(function(){
					showMsg("Accounts imported", true);
					self.cancelImport();
					self.loadData();
					
					self.selectedImport(undefined);
					$("#contactInfo").html("");
			    	$("#contactDetails").html("");
					self.displayingInfo(true);
				});
		}
	};
	
	self.loadData = function(){
		self.loadingContactList(true);
		$.getJSON(baseUri + "account", function(subscribedAccounts){
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
		
		$("#contactInfo").html("<h3>" + contactCompanyName + " <small>" + contactName + "</small></h3>");
		
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
		self.selectedContact(contact);
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
	//init();
	
//	var pages = ["dashboard", "contact" , "lead", "account", "product" ,"order", "map", "report", "settings"];
//	_.each(pages, function(page){
//		$("#nav-" + page).removeClass("active");
//	});
	$("#nav-account").addClass("active");
	
	var allContacts = $(".contactname").click(function(){
		allContacts.removeClass("btn-primary");
		$(this).addClass("btn-primary");
	});
	
});