function init() {
	lVM = new leadViewModel();
	ko.applyBindings(lVM);
}


function showConvertDialog(leadId, leadName){
	var lead = {};
	lead.Lead_Id = leadId;
	lead.Status = "Opportunity";
	lVM.update(lead);
	
	$("#alertbox").html("" + 
	"<div class='alert alert-block alert-success fade in'>" +
	"<button type='button' class='close' data-dismiss='alert'>&times;</button>" +
    leadName +" has been converted to Opportunity. Please ensure SLA is signed." +
    "</div>");
	
	//lVM.opportunitySelected(true);
}

function leadViewModel() {
	var self = this;
	self.newleads = ko.observableArray();
	self.opportunityleads = ko.observableArray();
	self.leadHistory = ko.observableArray([]);
	self.opportunitySelected = ko.observable(false);

	self.ajaxErrors = ko.observable();
	self.loadingNewLeads = ko.observable(true);
	self.loadingOpportunityLeads = ko.observable(true);
	
	self.selectedLead = ko.observable({});	
	self.selectedLeadHistory = ko.observable();
	self.updatingLeadHistory = ko.observable(false);
	
	$("#newFilterbar").hide();
	$("#opportunityFilterbar").hide();
	var baseUri = CRM_URL + 'lead/';
	
	self.metatadataNewLead = [];
	self.metatadataNewLead.push({ name: "Name", label: "Name", datatype: "string", editable: false});
	self.metatadataNewLead.push({ name: "Lead_Source", label: "Source", datatype: "string", editable: true});
	self.metatadataNewLead.push({ name: "Description", label: "Description", datatype: "string", editable: true});
	self.metatadataNewLead.push({ name: "Created", label: "Created", datatype: "String", editable: false});
	self.metatadataNewLead.push({ name: "action", label: " ", datatype: "html", editable: false});

	self.metatadataNewLead[1].values = {"Google":"Google","Social Network":"Social Network","Website":"Website","Email": "Email", "Newspaper": "Newspaper", "Agent": "Agent"};

	self.metatadataOpportunityLead = [];
	self.metatadataOpportunityLead.push({ name: "Name", label: "Name", datatype: "string", editable: false});
	self.metatadataOpportunityLead.push({ name: "Lead_Source", label: "Source", datatype: "string", editable: true});
	self.metatadataOpportunityLead.push({ name: "Description", label: "Description", datatype: "string", editable: true});
	self.metatadataOpportunityLead.push({ name: "Created", label: "Created", datatype: "String", editable: false});
	self.metatadataOpportunityLead.push({ name: "action", label: " ", datatype: "html", editable: false});

	self.metatadataOpportunityLead[1].values = {"Google":"Google","Social Network":"Social Network","Website":"Website","Email": "Email", "Newspaper": "Newspaper", "Agent": "Agent"};
	
	self.metadataLeadHistory = [];	
	self.metadataLeadHistory.push({ name: "Comment", label: "Comment", datatype: "string", editable: false});
	self.metadataLeadHistory.push({ name: "Created_By", label: "Created By", datatype: "string", editable: false});
	self.metadataLeadHistory.push({ name: "Timestamp", label: "Created", datatype: "String", editable: false});
	self.metadataLeadHistory.push({ name: "action", label: " ", datatype: "html", editable: false});
	
	self.newEditableGrid = null;
	self.opportunityEditableGrid = null;
	self.leadHistoryGrid = null;
	
	self.newLeadData = [];
	self.opportunityLeadData = [];
	self.leadHistoryData = [];
	
	self.create = function(lead) {
		// TODO - Add field validation
		$.ajax({
			type : "POST",
			url : baseUri + 'add',
			data : lead
		}).done(function(data) {
			self.loadData();
			//var leadViewModel = ko.mapping.fromJS(lead, self);
		});
		
		self.creatingLead(undefined);
	};
	
	self.addLeadHistory = function(){
		var leadhistory = {};
		leadhistory.Lead_Id = self.selectedLead().Lead_Id;
		leadhistory.Lead_Name = self.selectedLead().Lead_Name;
		leadhistory.Comment = "";
		self.selectedLeadHistory(leadhistory);
		
		self.updatingLeadHistory(true);
		$("#leadHistoryFilterbar").hide();
		$("#leadHistoryContainer").hide();
	};

	self.showLeadHistory = function(leadId, leadName){
		self.selectedLead({Lead_Id: leadId, Lead_Name: leadName});
		
		$("#leadHistoryFilterbar").hide();
		$("#leadHistoryContainer").hide();
		$.getJSON(baseUri + leadId + "/history", function(allLeadHistory){
			self.leadHistory(allLeadHistory);
			$("#leadHistoryContainer").show();
			
			if(!_.isEmpty(allLeadHistory)) {
				$("#leadHistoryFilterbar").show();
				self.displayLeadHistoryGrid();
			} else{
				$("#leadHistory").html("<div class='alert alert-error'>History not available.</div>");
			}
		});	
	};
	
	self.createLeadHistory = function(leadhistory){
		//alert(JSON.stringify(leadhistory)); return false;
		$.ajax({
			type : "POST",
			url : baseUri + leadhistory.Lead_Id + '/history/add',
			data : leadhistory
		}).done(function(data) {
			self.cancelLeadHistory();
			self.showLeadHistory(leadhistory.Lead_Id, leadhistory.Lead_Name);
		});
	};
	
	self.cancelLeadHistory = function(){
		self.selectedLeadHistory(undefined);
		self.updatingLeadHistory(false);
	};
	
	self.removeLeadHistory = function(id) {
		var agree = confirm("Are you sure you want to remove this history record?");
		if(!agree) return false;
		
		$.ajax({
			type : "DELETE",
			url : baseUri + self.selectedLead().Lead_Id + '/history/id/' + id + '/delete'
		}).done(function(){
				self.cancelLeadHistory();
				self.showLeadHistory(self.selectedLead().Lead_Id, self.selectedLead().Lead_Name);
		});
	};
	
	self.removeNewLead = function(leadId) {
		var agree = confirm("Are you sure you want to delete this lead?");
		if(!agree) return false;
		
		// First remove from the server, then from the view-model.
		// If it is a new lead, delete it
		$.ajax({
			type : "DELETE",
			url : baseUri + leadId + '/delete'
		}).done(function(){
			self.loadData();
		});
	};
	
	self.removeOpportunityLead = function(leadId) {
		var agree = confirm("Are you sure you want to convert this back to Lead?");
		if(!agree) return false;
		// First remove from the server, then from the view-model.
		// If it is an opportunity, convert it back to Lead
		var lead = {};
		lead.Lead_Id = leadId;
		lead.Status = "New";
		self.update(lead);
	};

	self.update = function(lead) {
		$.ajax({
			type : "PUT",
			url : baseUri + lead.Lead_Id + '/update',
			data : lead
		}).done(function(data) {
			self.loadData();
		});
	};

	self.newleads.subscribe(function(newValue){
		if (newValue.length > 0){
			// TODO - do something when object model is updated
		}
	});
	

	self.updateSelectedTab = function(){
		self.opportunitySelected(!self.opportunitySelected());
		self.selectedLead({});
		self.leadHistory([]);
	};
	
	self.getTag = function (tag, callback){
		$.get(CRM_URL + 'tag/' + tag.Tag_Id, function(data){
			tag["Tag_Name"] = data.Tag_Name;
			callback();
		});
	};
		
	self.loadData = function(){
		self.selectedLead({});
		self.leadHistory([]);
		
		$("#newFilterbar").hide();
		$.getJSON(baseUri + "status/New/", function(allNewLeads){
			self.loadingNewLeads(false);
			$("#newFilterbar").show();
			self.newleads(allNewLeads);
			self.displayNewLeadGrid();
		});
		
		$("#opportunityFilterbar").hide();
		$.getJSON(baseUri + "status/Opportunity/", function(allOpportunityLeads){
			self.loadingOpportunityLeads(false);
			$("#opportunityFilterbar").show();
			self.opportunityleads(allOpportunityLeads);
			self.displayOpportunityLeadGrid();
		});
		
		
	};
	
	self.loadNewLeadGrid = function(){
		self.newLeadData = [];
		
		_.each(self.newleads(), function(item){
			self.newLeadData.push({id: item.Lead_Id, values: item});
		});
		
		self.newEditableGrid.load({"metadata": self.metatadataNewLead, "data": self.newLeadData});
		self.newEditableGrid.initializeGrid();
		self.newEditableGrid.renderGrid("newLeads", "leadgrid table table-striped table-hover table-condensed");
	};
	
	self.loadOpportunityLeadGrid = function(){
		self.opportunityLeadData = [];
		
		_.each(self.opportunityleads(), function(item){
			self.opportunityLeadData.push({id: item.Lead_Id, values: item});
		});
			
		self.opportunityEditableGrid.load({"metadata": self.metatadataOpportunityLead, "data": self.opportunityLeadData});
		self.opportunityEditableGrid.initializeGrid();
		self.opportunityEditableGrid.renderGrid("opportunityLeads", "leadgrid table table-striped table-hover table-condensed");

	};
	
	self.loadLeadHistoryGrid = function(){
		self.leadHistoryData  = [];
		
		_.each(self.leadHistory(), function(item){
			self.leadHistoryData.push({id: item.Id, values: item});
		});
		
		self.leadHistoryGrid.load({"metadata": self.metadataLeadHistory, "data": self.leadHistoryData});
		self.leadHistoryGrid.initializeGrid();
		self.leadHistoryGrid.renderGrid("leadHistory", "leadhistorygrid table table-striped table-hover table-condensed");
	};
		
	self.displayLeadHistoryGrid = function(){
		self.leadHistoryGrid = new EditableGrid("LeadHistoryGrid",{
			enableSort: true,
			pageSize: 20,
		});
		
		self.leadHistoryGrid.initializeGrid = function(){
			with (this){				

				setCellRenderer("action", new CellRenderer({render: function(cell, value) {
					// this action will remove the row, so first find the ID of the row containing this cell
					var rowId = getRowId(cell.rowIndex);
					//var leadName = getValueAt(cell.rowIndex, 0);
					$(cell).css("width","80x");
					cell.innerHTML ="<a style='text-decoration: none; color: indianred; font-size: 17px' href='#' class='lead' onClick='lVM.removeLeadHistory(\"" + rowId + "\");'><i class='icon-trash icon-large'></i></a>";
				}}));
				
				setCellRenderer("Timestamp", new CellRenderer({render: function(cell, value) {
					d = new Date();
					d.setTime(parseInt(value) - (d.getTimezoneOffset() * 60000));
					cell.innerHTML = (d.getFullYear()) + '-' + ('0' + (d.getMonth() + 1)).substr(-2, 2) + '-' + ('0' + d.getDate()).substr(-2, 2);
				}}));				
				
				// set active (stored) filter if any
				//_$('filter').value = currentFilter ? currentFilter : '';
				
				// filter when something is typed into filter
				_$('lead-history-filter').onkeyup = function() { self.leadHistoryGrid.filter(_$('lead-history-filter').value); };
				
				modelChanged = function(rowIndex, columnIndex, oldValue, newValue, row) {
		   	    	this.sort('Name');
				};
				
			}
		};		
		
		self.loadLeadHistoryGrid();
	};
	
	self.displayNewLeadGrid = function(){	
		self.newEditableGrid = new EditableGrid("NewLeadGrid",{
			enableSort: true,
			pageSize: 20,
		});
		
		self.newEditableGrid.initializeGrid = function(){
			with (this){				
				setCellRenderer("Name", new CellRenderer({
					render: function(cell,value) {
						$(cell).css("width","150x");
						$(cell).html("<i class='icon-flag'></i>&nbsp;" + value);
					}
				}));
				
				setHeaderRenderer("action", new CellRenderer({
					render: function(cell,value) {
						//$(cell).css("width","60px");
					}
				}));
				
				setCellRenderer("action", new CellRenderer({render: function(cell, value) {
					// this action will remove the row, so first find the ID of the row containing this cell
					var rowId = getRowId(cell.rowIndex);
					var leadName = getValueAt(cell.rowIndex, 0);
					$(cell).css("width","80x");
					cell.innerHTML ="<a style='text-decoration: none; color: indianred; font-size: 17px' onClick='lVM.removeNewLead(\"" + rowId + "\"); lVM.newEditableGrid.remove(" + cell.rowIndex + ");' title='Delete this lead' href='#' class='lead'><i class='icon-trash icon-large'></i></a>" +
							"&nbsp;&nbsp;<a style='text-decoration: none; color: steelblue; font-size: 17px' onClick='showConvertDialog(\"" + rowId + "\", \"" + leadName + "\");' title='Convert this lead to an opportunity' href='#' class='lead'><i class='icon-star icon-large'></i></a>" +
							"&nbsp;&nbsp;<a style='text-decoration: none; color: limegreen; font-size: 17px' onClick='javascript: lVM.showLeadHistory(\"" + rowId + "\", \"" + leadName + "\")' title='Show history' href='#'><i class='icon-info-sign icon-large'></i></a>";
				}}));
				
				setCellRenderer("Created", new CellRenderer({render: function(cell, value) {
					d = new Date();
					d.setTime(parseInt(value) - (d.getTimezoneOffset() * 60000));
					cell.innerHTML = (d.getFullYear()) + '-' + ('0' + (d.getMonth() + 1)).substr(-2, 2) + '-' + ('0' + d.getDate()).substr(-2, 2);
				}}));	
				
				// set active (stored) filter if any
				//_$('filter').value = currentFilter ? currentFilter : '';
				
				// filter when something is typed into filter
				_$('new-lead-filter').onkeyup = function() { self.newEditableGrid.filter(_$('new-lead-filter').value); };
				
				
				modelChanged = function(rowIndex, columnIndex, oldValue, newValue, row) {
					//displayMessage("Value for '" + this.getColumnName(columnIndex) + "' in row " + this.getRowId(rowIndex) + " has changed from '" + oldValue + "' to '" + newValue + "'");
					var lead = {};
					lead.Lead_Id = this.getRowId(rowIndex);
		   	    	lead[this.getColumnName(columnIndex)] = newValue;
		   	    	
		   	    	this.sort('Name');
		   	    	
		   	    	self.update(lead);
				};
				
			}
		};
		
		
		self.loadNewLeadGrid();
	};
	
	self.displayOpportunityLeadGrid = function(){	
		self.opportunityEditableGrid = new EditableGrid("OpportunityLeadGrid",{
			enableSort: true,
			pageSize: 20,
		});
		
		self.opportunityEditableGrid.initializeGrid = function(){
			with (this){				
				setCellRenderer("Name", new CellRenderer({
					render: function(cell,value) {
						$(cell).css("width","150x");
						$(cell).html("<i class='icon-user'></i>&nbsp;" + value);
					}
				}));
				
				setHeaderRenderer("action", new CellRenderer({
					render: function(cell,value) {
						//$(cell).css("width","25px");
					}
				}));
				
				setCellRenderer("action", new CellRenderer({render: function(cell, value) {
					// this action will remove the row, so first find the ID of the row containing this cell
					var rowId = getRowId(cell.rowIndex);
					var leadName = getValueAt(cell.rowIndex, 0);
					cell.innerHTML ="<a style='text-decoration: none; color: indianred; font-size: 17px' onClick='lVM.removeOpportunityLead(\"" + rowId + "\"); lVM.opportunityEditableGrid.remove(" + cell.rowIndex + ");' title='Convert back to lead' href='#' class='opportunity'><i class='icon-trash icon-large'></i></a>" +
									"&nbsp;&nbsp;<a style='text-decoration: none; color: limegreen; font-size: 17px' onClick='javascript: lVM.showLeadHistory(\"" + rowId + "\", \"" + leadName + "\")' title='Show history' href='#'><i class='icon-info-sign icon-large'></i></a>";
				}}));
				
				setCellRenderer("Created", new CellRenderer({render: function(cell, value) {
					d = new Date();
					d.setTime(parseInt(value) - (d.getTimezoneOffset() * 60000));
					cell.innerHTML = (d.getFullYear()) + '-' + ('0' + (d.getMonth() + 1)).substr(-2, 2) + '-' + ('0' + d.getDate()).substr(-2, 2);
				}}));	
				
				// set active (stored) filter if any
				//_$('filter').value = currentFilter ? currentFilter : '';
				
				// filter when something is typed into filter
				_$('opportunity-lead-filter').onkeyup = function() { self.opportunityEditableGrid.filter(_$('opportunity-lead-filter').value); };
							
				modelChanged = function(rowIndex, columnIndex, oldValue, newValue, row) { 
					//displayMessage("Value for '" + this.getColumnName(columnIndex) + "' in row " + this.getRowId(rowIndex) + " has changed from '" + oldValue + "' to '" + newValue + "'");
					var lead = {};
					lead.Lead_Id = this.getRowId(rowIndex); 
		   	    	lead[this.getColumnName(columnIndex)] = newValue;
		   	    	
		   	    	this.sort('Name');
		   	    	
		   	    	self.update(lead);
				};
				
			}
		};
		
		self.loadOpportunityLeadGrid();
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
	$("#nav-lead").addClass("active");
	
});