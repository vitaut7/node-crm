var sampleTask = null;
var tVM = null;

function init() {
	setupModalBinding();

	tVM = new taskViewModel();
	ko.applyBindings(tVM);
	
	Date.prototype.addDays = function(days) {
	    this.setDate(this.getDate() + days);
	    return this;
	};

	Date.prototype.addMinutes = function(minutes) {
	    this.setMinutes(this.getMinutes() + minutes);
	    return this;
	};

}

function setupModalBinding() {
	ko.bindingHandlers['modal'] = {
		init : function(element, valueAccessor, allBindingsAccessor) {
			var allBindings = allBindingsAccessor();
			var $element = $(element);
			$element.addClass('hide modal');

			if (allBindings.modalOptions) {
				if (allBindings.modalOptions.beforeClose) {
					$element.on('hide', function() {
						return allBindings.modalOptions.beforeClose();
					});
				}
			}

			return ko.bindingHandlers['with'].init.apply(this, arguments);
		},
		update : function(element, valueAccessor) {
			var value = ko.utils.unwrapObservable(valueAccessor());

			var returnValue = ko.bindingHandlers['with'].update.apply(this,
					arguments);

			if (value) {
				$(element).modal('show');
			} else {
				$(element).modal('hide');
			}
			return returnValue;
		}
	};
}

function deleteEvent(calendarId, title, start, end){
	if (end === 'null') end = start;
	$.ajax({
		type : "DELETE",
		url : CRM_URL + 'calendar/' + calendarId + '/delete',
		data : {title: title, start: start, end: end}
	}).done(function(data) {
			$("#calendar").fullCalendar("removeEvents", calendarId);
			
			//tVM.loadCalendar();
			location.hash = "#calendar";
	});
}


function taskViewModel() {
	var self = this;
	self.tasks = ko.observableArray();
	
	self.events = ko.observableArray();
	self.selectedEvent = ko.observable();
	
	self.ajaxErrors = ko.observable();
	//self.creatingTask = ko.observable();
	self.loadingTasks = ko.observable(true);
	self.calendarLoaded = ko.observable(false);
	
	$("#filterbar").hide();
	var baseUri = CRM_URL + 'task/';
	
	self.metatadataTask = [];
	self.metatadataTask.push({ name: "Description", label: "Description", datatype: "string", editable: true});
	//self.metatadataTask.push({ name: "Deadline", label: "Deadline", datatype: "date", editable: true});
	self.metatadataTask.push({ name: "Priority", label: "Priority", datatype: "string", editable: true});
	self.metatadataTask.push({ name: "Related_Name", label: "Related To", datatype: "string", editable: false});
	//self.metatadataTask.push({ name: "Assigner", label: "Assigner", datatype: "string", editable: false});
	//self.metatadataTask.push({ name: "Created", label: "Created", datatype: "date", editable: true});
	self.metatadataTask.push({ name: "Status", label: "Status", datatype: "string", editable: true});
	self.metatadataTask.push({ name: "action", label: " ", datatype: "html", editable: false});

	self.metatadataTask[1].values = {"High":"High","Medium":"Medium","Low":"Low"};
	self.metatadataTask[3].values = {"Not Started":"Not Started","In Progress":"In Progress","Completed":"Completed"};
	
	self.editableGrid = null;
	self.taskData = [];

	self.create = function() {
		var task = {
				//"Created" : ((new Date()).getFullYear()) + '-' + ('0' + ((new Date()).getMonth() + 1)).substr(-2, 2) + '-' + ('0' + (new Date()).getDate()).substr(-2, 2),
				//"Deadline" : ((new Date()).getFullYear()) + '-' + ('0' + ((new Date()).getMonth() + 1)).substr(-2, 2) + '-' + ('0' + (new Date()).getDate()).substr(-2, 2),
				//"Priority" : "Medium",
				"Description" : "New Task",
				"Related_To" : whoAmI.Contact_Id,
				//"Assigner_Id": whoAmI.Contact_Id,
				//"Status" : "Not Started"
			};
		
		$.ajax({
			type : "POST",
			url : baseUri + 'add',
			data : task
		}).done(function() {
				self.loadData();
				//var taskViewModel = ko.mapping.fromJS(lead, self);
		});
	};

	self.remove = function(taskId) {
		// First remove from the server, then from the view-model.
		// If it is a new task, delete it
		$.ajax({
			type : "DELETE",
			url : baseUri + taskId + '/delete'
		}).done(function(){
			self.loadData();
		});
	};

	self.update = function(task) {
		$.ajax({
			type : "PUT",
			url : baseUri + task.Task_Id + '/update',
			data : task
		}).done( function(data) {
				self.loadData();
		});
	};

	self.loadData = function(){
		$("#filterbar").hide();
		$.getJSON(baseUri, function(allTasks){
			self.loadingTasks(false);
			$("#filterbar").show();
			self.tasks(allTasks);
			self.displayTaskGrid();
		});
		
		self.loadCalendar();
	};

	self.loadCalendar = function(initial){
		$.getJSON(CRM_URL + "calendar/", function(calendarData){
			if(!_.isEmpty(calendarData) && (!_.isNull(calendarData))) {
				calendarData.id = calendarData.Calendar_Id;
				self.events(calendarData);
				//alert(JSON.stringify(self.events()));
			} else {
				self.events([]);
			}
			
			if(!self.calendarLoaded()){
				self.initializeCalendar();
			} else {
				$("#calendar").fullCalendar('refetchEvents');
				$("#calendar").fullCalendar('rerenderEvents');
			}
		});
	};
	
	self.initializeCalendar = function(){
		//Populate calendar
		var date = new Date();
		var d = date.getDate();
		var m = date.getMonth();
		var y = date.getFullYear();
		
		self.calendarLoaded(true);
		
		var calendar = $('#calendar').fullCalendar({
			header: {
				left: 'prev,next today',
				center: 'title',
				right: 'month,agendaWeek,agendaDay'
			},
			selectable: true,
			selectHelper: true,
			select: function(start, end, allDay) {
				var newEvent = {};
				newEvent.id = Math.uuid().toLowerCase();
				newEvent.start = start;
				newEvent.end = end;
				newEvent.url = "#calendar";
				newEvent.title = "";
				newEvent.description = "";
				newEvent.allDay = (allDay)?1:0;
				self.selectedEvent(newEvent);
				
				$("#eventModal").modal("show");
				calendar.fullCalendar('unselect');
			},
			editable: true,
			events: self.events(),
			eventClick: function(event, jsEvent, view) {
	            var popover = $(this).data('popover');
	            var shown = popover && popover.tip().is(':visible');
	            if(shown) return;        // Avoids flashing
				$(this).popover('show');
				
				return false;//Prevent opening URL in new window.
			},
			eventRender: function(event, element) {
				console.log("Event: ", event.title, event.start, event.end);
				
				var description = "&nbsp;";
				if((!_.isUndefined(event.description)) && event.description){
					description = event.description;
				}
				var content = description + "<br/><a href='#' style='width: 50%' class='btn btn-small btn-danger' " 
										+ "title='Delete this event' onClick='javascript: deleteEvent(\""+ event.id +"\");'><i class='icon-trash icon-large'</a>";
							//"&nbsp;<a href='#' class='btn btn-small' onClick='javascript: alert($(this).parents(\".popover:first\").html());'>Cancel</a>";
				$(element).popover({html: true, placement: "bottom", title: event.title});
				$(element).attr("data-content",content);
				$(element).attr("rel","popover");
			},
			eventResize: function(event,dayDelta,minuteDelta,revertFunc) {
		        self.updateEvent({id: event.id, end: event.end});
		    },
		    eventDrop: function(event,dayDelta,minuteDelta,allDay,revertFunc) {
		    	self.updateEvent({id: event.id, start: event.start, end: event.end});
		    }	    
		});
	};
	
	self.createEvent = function(event){
		if (self.selectedEvent().title) {
			$.ajax({
				type : "POST",
				url : CRM_URL + 'calendar/add',
				data : self.selectedEvent()
			}).done(function(data) {
				if(data.status === 'ok') {
					self.selectedEvent().id = data.id;
					$('#calendar').fullCalendar('renderEvent',
							{
								id: data.id,
								title: self.selectedEvent().title,
								start: self.selectedEvent().start,
								end: self.selectedEvent().end,
								description: self.selectedEvent().description,
								allDay: (self.selectedEvent().allDay)?true:false,
								url: self.selectedEvent().url,
							},
							true // make the event "stick"
					);
										
					self.cancelEvent();
				};
				
				//self.loadCalendar();
				location.hash = "#calendar";
				// Reload Page: //location.reload();
			});
			
		} else { self.cancelEvent(); }
	};
	
	self.updateEvent = function(event){
		if(!_.isUndefined(event.id)) {
			$.ajax({
				type : "PUT",
				url : CRM_URL + 'calendar/' + event.id + '/update',
				data : event
			}).done(function(data) {
					self.cancelEvent();
					
					self.loadCalendar();
					location.hash = "#calendar";
			});
		}
	};
	
	self.cancelEvent = function(){
		$("#eventModal").modal("hide");
		self.selectedEvent(undefined);
	};
	
	self.tasks.subscribe(function(newValue){
		if (newValue.length > 0){
			//var data = _.pluck(ko.toJS(self.tasks),"Status");
			//self.showTaskProgress();
			//self.showFunnelChart();
		}		
	});
	
	self.loadTaskGrid = function(){
		self.taskData = [];
		
		_.each(self.tasks(), function(item){
			self.taskData.push({id: item.Task_Id, values: item});
		});
		
		self.editableGrid.load({"metadata": self.metatadataTask, "data": self.taskData});
		self.editableGrid.initializeGrid();
		self.editableGrid.renderGrid("tasks", "taskgrid table table-striped table-hover table-condensed");
	};
	
	self.displayTaskGrid = function(){		
		self.editableGrid = new EditableGrid("TaskGrid",{
			enableSort: true,
			pageSize: 20,
		});
		
		self.editableGrid.initializeGrid = function(){
			with (this){				
				setCellRenderer("action", new CellRenderer({render: function(cell, value) {
					// this action will remove the row, so first find the ID of the row containing this cell
					var rowId = getRowId(cell.rowIndex);
					//var taskName = getValueAt(cell.rowIndex, 0);
					
					cell.innerHTML ="<a style='text-decoration: none; color: indianred; font-size: 17px' title='Remove this task' onClick='if(confirm(\"Do you want to delete this task?\")) {tVM.remove(\"" + rowId + "\"); tVM.editableGrid.remove(" + cell.rowIndex + ");}' href='#' class='task'><i class='icon-trash icon-large'></i></a>";
				}}));
				
				setHeaderRenderer("Status", new CellRenderer({render: function(cell, value) {
					$(cell).css("width","100px");
				}}));
				
				setCellRenderer("Status", new CellRenderer({render: function(cell, value) {
					var rowId = getRowId(cell.rowIndex);
					$(cell).css("color","white");
					
					var row = "#TaskGrid_" + rowId;
					
					if (value === "Completed"){
						$(cell).css("background-color","SeaGreen");
						$(row).css("text-decoration","line-through");
					} else if (value === "In Progress"){
						$(cell).css("background-color","Tomato");
					} else if (value === "Not Started"){
						$(cell).css("background-color","SteelBlue");
					}
					
					cell.innerHTML = value;
					
				}}));
				
				setCellRenderer("Priority", new CellRenderer({render: function(cell, value) {
					if (value === "High"){
						$(cell).css("color","Red");
					} else if (value === "Medium"){
						$(cell).css("color","Black");
					} else if (value === "Low"){
						$(cell).css("color","Gray");
					}
					cell.innerHTML = value;
				}}));
				// set active (stored) filter if any
				//_$('filter').value = currentFilter ? currentFilter : '';
				
				// filter when something is typed into filter
				_$('task-filter').onkeyup = function() { self.editableGrid.filter(_$('task-filter').value); };
				
				
				modelChanged = function(rowIndex, columnIndex, oldValue, newValue, row) { 
					//displayMessage("Value for '" + this.getColumnName(columnIndex) + "' in row " + this.getRowId(rowIndex) + " has changed from '" + oldValue + "' to '" + newValue + "'");
					var task = {};
					task.Task_Id = this.getRowId(rowIndex);
		   	    	task[this.getColumnName(columnIndex)] = newValue;
		   	    	self.update(task);
				};
				
			}
		};
		
		self.loadTaskGrid();
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
	$('#nav-dashboard').addClass("active");
	
	var today = ((new Date()).getFullYear()) + '-' + ('0' + ((new Date()).getMonth() + 1)).substr(-2, 2) + '-' + ('0' + (new Date()).getDate()).substr(-2, 2);
	$("#divDate").attr("data-date",today);
	$("#selectDate").val(today);
	//$('#alert').hide();
});