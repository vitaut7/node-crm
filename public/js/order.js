function init() {
	oVM = new orderViewModel();
	ko.applyBindings(oVM);
}


function orderViewModel() {
	var self = this;
	self.orders = ko.observableArray();
	
	self.ajaxErrors = ko.observable();
	//self.creatingOrder = ko.observable();
	self.loadingOrders = ko.observable(true);
	
	self.selectedOrder = ko.observable({});	
	self.orderHistory = ko.observableArray([]);
	self.selectedOrderHistory = ko.observable();
	self.updatingOrderHistory = ko.observable(false);
	
	$("#filterbar").hide();
	var baseUri = CRM_URL + 'order/';
	
	self.metatadataOrder = [];
	self.metatadataOrder.push({ name: "Company_Name", label: "Customer", datatype: "string", editable: false});
	self.metatadataOrder.push({ name: "Order_Date", label: "Date", datatype: "string", editable: false});
	self.metatadataOrder.push({ name: "Order_Deadline", label: "Deadline", datatype: "string", editable: true});
	self.metatadataOrder.push({ name: "Product_Name", label: "Product Name", datatype: "string", editable: false});
	self.metatadataOrder.push({ name: "Quantity", label: "Quantity", datatype: "string", editable: true});
	self.metatadataOrder.push({ name: "Description", label: "Description", datatype: "string", editable: true});
	self.metatadataOrder.push({ name: "Status", label: "Status", datatype: "string", editable: true});
	self.metatadataOrder.push({ name: "action", label: " ", datatype: "html", editable: false});

	//self.metatadataOrder[2].values = {"Automotive":"Automotive","General","General","Industrial":"Industrial","Electronics":"Electronics"};
	//self.metatadataOrder[1].values = {"General":"General","VCI Films":"VCI Films","VCI Paper":"VCI Paper","Oil":"Oil","Headphones":"Headphones"};
	
	self.metatadataOrder[6].values = {"New":"New","Payment Receipt":"Payment Receipt","Completed":"Completed","Cancelled":"Cancelled"};
	
	self.metadataOrderHistory = [];	
	self.metadataOrderHistory.push({ name: "Comment", label: "Comment", datatype: "string", editable: false});
	self.metadataOrderHistory.push({ name: "Created_By", label: "Created By", datatype: "string", editable: false});
	self.metadataOrderHistory.push({ name: "Timestamp", label: "Created", datatype: "String", editable: false});
	self.metadataOrderHistory.push({ name: "action", label: " ", datatype: "html", editable: false});
	
	self.editableGrid = null;
	self.orderHistoryGrid = null;
	
	self.newOrderData = [];
	self.orderHistoryData = [];

	self.addOrderHistory = function(){
		var orderhistory = {};
		orderhistory.Order_Id = self.selectedOrder().Order_Id;
		orderhistory.Order_Name = self.selectedOrder().Order_Name;
		orderhistory.Comment = "";
		self.selectedOrderHistory(orderhistory);
		
		self.updatingOrderHistory(true);
		$("#orderHistoryFilterbar").hide();
		$("#orderHistoryContainer").hide();
	};
	
	self.showOrderHistory = function(orderId, orderName){
		self.selectedOrder({Order_Id: orderId, Order_Name: orderName});
		
		$("#orderHistoryFilterbar").hide();
		$("#orderHistoryContainer").hide();
		$.getJSON(baseUri + orderId + "/history", function(allOrderHistory){
			self.orderHistory(allOrderHistory);
			
			$("#orderHistoryContainer").show();
			
			if(!_.isEmpty(allOrderHistory)) {
				$("#orderHistoryFilterbar").show();
				self.displayOrderHistoryGrid();
			} else{
				$("#orderHistory").html("<div class='alert alert-error'>History not available.</div>");
			}
		});	
	};
	
	self.createOrderHistory = function(orderhistory){
		$.ajax({
			type : "POST",
			url : baseUri + orderhistory.Order_Id + '/history/add',
			data : orderhistory
		}).done(function(data) {
			self.cancelOrderHistory();
			self.showOrderHistory(orderhistory.Order_Id, orderhistory.Order_Name);
		});
	};
	
	self.cancelOrderHistory = function(){
		self.selectedOrderHistory(undefined);
		self.updatingOrderHistory(false);
	};
	
	self.removeOrderHistory = function(id) {
		var agree = confirm("Are you sure you want to remove this history record?");
		if(!agree) return false;
		
		$.ajax({
			type : "DELETE",
			url : baseUri + self.selectedOrder().Order_Id + '/history/id/' + id + '/delete'
		}).done(function(data){
				self.cancelOrderHistory();
				self.showOrderHistory(self.selectedOrder().Order_Id, self.selectedOrder().Order_Name);
		});
	};
	
	self.remove = function(orderId) {
		var agree = confirm("Are you sure you want to delete this order?");
		if(!agree) return false;
		// First remove from the server, then from the view-model.
		// If it is a new order, delete it
		$.ajax({
			type : "DELETE",
			url : baseUri + orderId + '/delete'
		}).done(function(){
				self.loadData();
		});
	};

	self.update = function(order) {
		$.ajax({
			type : "PUT",
			url : baseUri + order.Order_Id + '/update',
			data : order
		}).done(function(data) {
				self.loadData();
		});
	};

	self.loadData = function(){
		$("#filterbar").hide();
		$.getJSON(baseUri, function(allOrders){
			self.selectedOrder(undefined);
			
			self.loadingOrders(false);
			$("#filterbar").show();
			self.orders(allOrders);
			self.displayOrderGrid();
		});
	};
	
	self.loadOrderHistoryGrid = function(){
		self.orderHistoryData  = [];
		
		_.each(self.orderHistory(), function(item){
			self.orderHistoryData.push({id: item.Id, values: item});
		});
		
		self.orderHistoryGrid.load({"metadata": self.metadataOrderHistory, "data": self.orderHistoryData});
		self.orderHistoryGrid.initializeGrid();
		self.orderHistoryGrid.renderGrid("orderHistory", "orderhistorygrid table table-striped table-hover table-condensed");
	};
	
	self.displayOrderHistoryGrid = function(){
		self.orderHistoryGrid = new EditableGrid("OrderHistoryGrid",{
			enableSort: true,
			pageSize: 20,
		});
		
		self.orderHistoryGrid.initializeGrid = function(){
			with (this){				

				setCellRenderer("action", new CellRenderer({render: function(cell, value) {
					// this action will remove the row, so first find the ID of the row containing this cell				
					if(parseInt(whoAmI.isManager)) {
						var rowId = getRowId(cell.rowIndex);
						//var orderName = getValueAt(cell.rowIndex, 0);
						$(cell).css("width","80x");
						cell.innerHTML ="<a style='text-decoration: none; color: indianred; font-size: 17px' href='#' class='order' onClick='oVM.removeOrderHistory(\"" + rowId + "\");'><i class='icon-trash icon-large'></i></a>";
					} else 
						cell.innerHTML = "";
				}}));
				
				setCellRenderer("Timestamp", new CellRenderer({render: function(cell, value) {
					d = new Date();
					d.setTime(parseInt(value) - (d.getTimezoneOffset() * 60000));
					cell.innerHTML = (d.getFullYear()) + '-' + ('0' + (d.getMonth() + 1)).substr(-2, 2) + '-' + ('0' + d.getDate()).substr(-2, 2) + " " + ('0' + d.getHours()).substr(-2, 2) + ":" + ('0' + d.getMinutes()).substr(-2, 2);
				}}));	
				
				// set active (stored) filter if any
				//_$('filter').value = currentFilter ? currentFilter : '';
				
				// filter when something is typed into filter
				_$('order-history-filter').onkeyup = function() { self.orderHistoryGrid.filter(_$('order-history-filter').value); };
				
				modelChanged = function(rowIndex, columnIndex, oldValue, newValue, row) {
		   	    	this.sort('Name');
				};
				
			}
		};		
		
		self.loadOrderHistoryGrid();
	};
	
	self.loadOrderGrid = function(){
		self.orderData = [];
		
		_.each(self.orders(), function(item){
			self.orderData.push({id: item.Order_Id, values: item});
		});
		
		self.editableGrid.load({"metadata": self.metatadataOrder, "data": self.orderData});
		self.editableGrid.initializeGrid();
		self.editableGrid.renderGrid("orders", "ordergrid table table-striped table-hover table-condensed");
	};
	
	self.displayOrderGrid = function(){		
		self.editableGrid = new EditableGrid("OrderGrid",{
			enableSort: true,
			pageSize: 20,
		});
		
		self.editableGrid.initializeGrid = function(){
			with (this){				
				setCellRenderer("action", new CellRenderer({render: function(cell, value) {
					var htmlString = "";
					var rowId = getRowId(cell.rowIndex);
					
					// this action will remove the row, so first find the ID of the row containing this cell
					
					var orderName = getValueAt(cell.rowIndex, 0);
					
					htmlString = "<a style='text-decoration: none; color: steelblue; font-size: 17px' onClick='javascript: oVM.showOrderHistory(\"" + rowId + "\", \"" + orderName + "\")' title='Show history' href='#'><i class='icon-info-sign icon-large'></i></a>";
					
					if(parseInt(whoAmI.isManager)) {
						htmlString += "&nbsp;&nbsp;<a style='text-decoration: none; color: indianred; font-size: 17px' onClick='oVM.remove(\"" + rowId + "\");' href='#' title='Remove this order' class='order'><i class='icon-trash icon-large'></i></a>";
					}
					
					cell.innerHTML = htmlString;
					
				}}));
				
				setCellRenderer("Order_Date", new CellRenderer({render: function(cell, value) {
					d = new Date();
					d.setTime(parseInt(value) - (d.getTimezoneOffset() * 60000));
					cell.innerHTML = (d.getFullYear()) + '-' + ('0' + (d.getMonth() + 1)).substr(-2, 2) + '-' + ('0' + d.getDate()).substr(-2, 2) + " " + ('0' + d.getHours()).substr(-2, 2) + ":" + ('0' + d.getMinutes()).substr(-2, 2);
				}}));	
				
				setCellRenderer("Status", new CellRenderer({render: function(cell, value) {
					//var rowId = getRowId(cell.rowIndex);
					$(cell).css("color","white");
					
					//var row = "#OrderGrid_" + rowId;
					
					if (value === "Completed"){
						$(cell).css("background-color","SeaGreen");
					} else if (value === "Payment Receipt"){
						$(cell).css("background-color","Tomato");
					} else if (value === "New"){
						$(cell).css("background-color","SteelBlue");
					} else if (value === "Cancelled"){
						$(cell).css("background-color","IndianRed");
					}
					
					cell.innerHTML = value;
					
				}}));
				
				// set active (stored) filter if any
				//_$('filter').value = currentFilter ? currentFilter : '';
				
				// filter when something is typed into filter
				_$('order-filter').onkeyup = function() { self.editableGrid.filter(_$('order-filter').value); };
				
				
				modelChanged = function(rowIndex, columnIndex, oldValue, newValue, row) { 
					//displayMessage("Value for '" + this.getColumnName(columnIndex) + "' in row " + this.getRowId(rowIndex) + " has changed from '" + oldValue + "' to '" + newValue + "'");
					var order = {};
					order.Order_Id = this.getRowId(rowIndex);
		   	    	order[this.getColumnName(columnIndex)] = newValue;
		   	    	this.sort('Order_Date', true);
		   	    	self.update(order);
				};
				
			}
		};
		
		self.loadOrderGrid();
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
	$("#nav-order").addClass("active");
	
});