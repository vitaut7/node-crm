function init() {
	pVM = new productViewModel();
	ko.applyBindings(pVM);
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

function productViewModel() {
	var self = this;
	self.products = ko.observableArray();
	
	self.ajaxErrors = ko.observable();
	//self.creatingProduct = ko.observable();
	self.loadingProducts = ko.observable(true);
	
	self.productImporting = ko.observable(false);
	self.selectedImport = ko.observable();
	
	$("#filterbar").hide();
	var baseUri = CRM_URL + 'product/';
	
	self.metatadataProduct = [];
	self.metatadataProduct.push({ name: "Product_Name", label: "Product Name", datatype: "string", editable: true});
	self.metatadataProduct.push({ name: "Product_Segment", label: "Segment", datatype: "string", editable: true});
	self.metatadataProduct.push({ name: "Product_Category", label: "Category", datatype: "string", editable: true});
	self.metatadataProduct.push({ name: "Product_Description", label: "Description", datatype: "string", editable: true});
	//self.metatadataProduct.push({ name: "Min_Order", label: "Min Order", datatype: "string", editable: true});
	//self.metatadataProduct.push({ name: "Max_Order", label: "Max Order", datatype: "string", editable: true});
	self.metatadataProduct.push({ name: "Product_Added", label: "Added", datatype: "date", editable: false});
	self.metatadataProduct.push({ name: "Product_Status", label: "Status", datatype: "string", editable: true});
	self.metatadataProduct.push({ name: "action", label: " ", datatype: "html", editable: false});

	//self.metatadataProduct[2].values = {"Automotive":"Automotive","General","General","Industrial":"Industrial","Electronics":"Electronics"};
	//self.metatadataProduct[1].values = {"General":"General","VCI Films":"VCI Films","VCI Paper":"VCI Paper","Oil":"Oil","Headphones":"Headphones"};
	self.metatadataProduct[5].values = {"Available":"Available","Discontinued":"Discontinued"};
	
	self.editableGrid = null;
	self.productData = [];

	self.create = function() {
		// TODO - Add field validation
		var product = {};
		//product.Product_Added = ((new Date()).getTime() + ((new Date()).getTimezoneOffset() * 60000));
		product.Product_Name = "New Product";
		product.Product_Segment = "General";
		product.Product_Category = "General";
		product.Product_Status = "Available";
		//product.Min_Order = "1";
		//product.Max_Order = "2";
		product.Product_Description = "Product Description";
		
		$.ajax({
			type : "POST",
			url : baseUri + 'add',
			data : product
		}).done(function(data) {
				self.loadData();
				//var productViewModel = ko.mapping.fromJS(lead, self);
		});
		
		//self.creatingProduct(undefined);		
	}

	self.remove = function(productId) {
		var agree = confirm("Are you sure you want to delete this product?");
		if(!agree) return false;
		//TODO - assert product contains Product_Id
		// First remove from the server, then from the view-model.
		// If it is a new product, delete it
		$.ajax({
			type : "DELETE",
			url : baseUri + productId + '/delete'
		}).done(function(data){
				self.loadData();
		});
	}

	self.update = function(product) {
		$.ajax({
			type : "PUT",
			url : baseUri + product.Product_Id + '/update',
			data : product
		}).done(function(data) {
				self.loadData();
		});
	};

	self.cancelImport = function(){
		self.selectedImport(undefined);
		self.productImporting(false);
		$("#productContainer").show();
	};
	
	self.importProduct = function(){
		self.selectedImport({});
		self.productImporting(true);
		$("#productContainer").hide();
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
					showMsg("Products imported.", true);
					self.cancelImport();
					self.loadData();
					
				}).fail(function(){
					showMsg("Product Import failed.", false);
					self.cancelImport();
				});

		}
		
	};
	
	self.loadData = function(){
		$("#filterbar").hide();
		$.getJSON(baseUri, function(allProducts){
			self.loadingProducts(false);
			$("#filterbar").show();
			self.products(allProducts);
			self.displayProductGrid();
		});
	};
	
	self.loadProductGrid = function(){
		self.productData = [];
		
		_.each(self.products(), function(item){
			self.productData.push({id: item.Product_Id, values: item});
		});
		
		self.editableGrid.load({"metadata": self.metatadataProduct, "data": self.productData});
		self.editableGrid.initializeGrid();
		self.editableGrid.renderGrid("products", "productgrid table table-striped table-hover table-condensed");
	};
	
	self.displayProductGrid = function(){		
		self.editableGrid = new EditableGrid("ProductGrid",{
			enableSort: true,
			pageSize: 20,
		});
		
		self.editableGrid.updatePaginator = function()
		{
			var paginator = $("#paginator").empty();
			var nbPages = this.getPageCount();

			// get interval
			var interval = this.getSlidingPageInterval(20);
			if (interval == null) return;
			
			// get pages in interval (with links except for the current page)
			var pages = this.getPagesInInterval(interval, function(pageIndex, isCurrent) {
				if (isCurrent) return $("<li>").addClass('disabled').append($("<a>").html(pageIndex + 1));
				return $("<li>").append($("<a>").css("cursor", "pointer").html(pageIndex + 1).click(function(event) { self.editableGrid.setPageIndex(parseInt($(this).html()) - 1); }));
			});
				
			// "first" link
			var link = $("<a>").html("First&nbsp;");
			if (!this.canGoBack()) link.css({ opacity : 0.4, filter: "alpha(opacity=40)" });
			else link.css("cursor", "pointer").click(function(event) { self.editableGrid.firstPage(); });
			paginator.append($("<ul>").append($("<li>").append(link)));

			// "prev" link
			link = $("<a>").html("Prev");
			if (!this.canGoBack()) link.css({ opacity : 0.4, filter: "alpha(opacity=40)" });
			else link.css("cursor", "pointer").click(function(event) { self.editableGrid.prevPage(); });
			paginator.append($("<ul>").append($("<li>").append(link)));

			// pages
			pageItems = $("<ul>");
			for (var p=0; p < pages.length; p++) pageItems.append(pages[p]);
			paginator.append(pageItems);
			
			// "next" link
			link = $("<a>").html("Next");
			if (!this.canGoForward()) link.css({ opacity : 0.4, filter: "alpha(opacity=40)" });
			else link.css("cursor", "pointer").click(function(event) { self.editableGrid.nextPage(); });
			paginator.append($("<ul>").append($("<li>").append(link)));

			// "last" link
			link = $("<a>").html("Last");
			if (!this.canGoForward()) link.css({ opacity : 0.4, filter: "alpha(opacity=40)" });
			else link.css("cursor", "pointer").click(function(event) { self.editableGrid.lastPage(); });
			paginator.append($("<ul>").append($("<li>").append(link)));
		};
		
		self.editableGrid.initializeGrid = function(){
			with (this){				
				setCellRenderer("Product_Name", new CellRenderer({
					render: function(cell,value) {
						$(cell).html("<i class='icon-qrcode'></i>&nbsp;" + value);
					}
				}));
				
				setCellRenderer("action", new CellRenderer({render: function(cell, value) {
					// this action will remove the row, so first find the ID of the row containing this cell
					var rowId = getRowId(cell.rowIndex);
					//var productName = getValueAt(cell.rowIndex, 0);
					
					cell.innerHTML ="<a style='text-decoration: none; color: indianred; font-size: 17px' onClick='pVM.remove(\"" + rowId + "\");' title='Delete this product' href='#' class='product'><i class='icon-trash icon-large'></i></a>";
				}}));
				
				/*addCellValidator("Max_Order", new CellValidator({ 
					isValid: function(value) { return (parseInt(value)) > 0; }
				}));
				
				addCellValidator("Min_Order", new CellValidator({ 
					isValid: function(value) { return (parseInt(value)) > 0; }
				}));*/
				
				
				setCellRenderer("Product_Status", new CellRenderer({render: function(cell, value) {
					var rowId = getRowId(cell.rowIndex);
					var row = "#ProductGrid_" + rowId;
					
					if (value === "Available"){
						$(cell).css("color","Green");
					} else if (value === "Discontinued"){
						$(cell).css("color","Red");
					}
					
					cell.innerHTML = value;
					
				}}));
				
				addCellValidator("Product_Description", new CellValidator({
				       isValid: function(value) { return value.length > 0; }
				}));
				
				// set active (stored) filter if any
				//_$('filter').value = currentFilter ? currentFilter : '';
				
				// filter when something is typed into filter
				_$('product-filter').onkeyup = function() { self.editableGrid.filter(_$('product-filter').value); };
				
				
				modelChanged = function(rowIndex, columnIndex, oldValue, newValue, row) { 
					//displayMessage("Value for '" + this.getColumnName(columnIndex) + "' in row " + this.getRowId(rowIndex) + " has changed from '" + oldValue + "' to '" + newValue + "'");
					var product = {};
					product.Product_Id = this.getRowId(rowIndex);
		   	    	product[this.getColumnName(columnIndex)] = newValue;
		   	    	this.sort('Product_Name');
		   	    	self.update(product);
				};
				
				tableRendered = function() { this.updatePaginator(); };
			}
		};
		
		self.loadProductGrid();
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
	$("#nav-product").addClass("active");
	
});