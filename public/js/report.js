var rVM;

function init() {
	//showTaskProgress();
	//showFunnelChart();
	rVM = new reportViewModel();
	ko.applyBindings(rVM);
}

function reportViewModel() {
	var self = this;

	self.showFunnelChart = function(){
		var canvasId = "cvsFunnel";
		var canvasGaugeId = "cvsGauge";
		RGraph.Reset($("#" + canvasId));
		RGraph.ObjectRegistry.Clear(canvasId);
		
		var counts = {};
		$.getJSON(CRM_URL + "contact/contact", function(subscribedAccounts){
			counts["Contacts"] = subscribedAccounts.length;
			$.getJSON(CRM_URL + "lead/status/Opportunity/", function(allOpportunityLeads){
				counts["Opportunities"] = allOpportunityLeads.length;
				$.getJSON(CRM_URL + "lead/status/New/", function(allNewLeads){
					counts["Leads"] = allNewLeads.length + parseInt(counts["Opportunities"]);
					$.getJSON(CRM_URL + "order/", function(allOrders){
						counts["Orders"] = allOrders.length;
						
				        if((counts["Opportunities"]) || (counts["Orders"])) {
					        var funnel = new RGraph.Funnel(canvasId, [counts['Contacts'],counts['Leads'],counts['Opportunities'],counts['Orders']]);
					        funnel.Set('chart.labels', ["Contacts (" + counts['Contacts'] + ")","Leads - ("  + counts['Leads'] + ")" ,"Opportunities - ("  + counts['Opportunities'] + ")" ,"Orders - ("  + counts['Orders'] + ")"]);
					        funnel.Set('chart.gutter.left', 180);
					        funnel.Set('chart.labels.sticks', true);
					        funnel.Set('chart.strokestyle', 'rgba(0,0,0,0)');
					        funnel.Set('chart.text.boxed', false);
					        funnel.Set('chart.labels.x', 10);
					        funnel.Set('chart.shadow.offsetx', 0);
					        funnel.Set('chart.shadow.offsety', 0);
					        funnel.Set('chart.shadow.blur', 15);
					        funnel.Set('chart.shadow.color', 'gray');
					        funnel.Set('chart.shadow', true);
				        	funnel.Draw();
				        } else {
				        	var canvas = document.getElementById(canvasId);
				        	var context = canvas.getContext("2d");
					        context.fillStyle = "gray";
					        context.font = "bold 16px Arial";
					        context.fillText("Insufficient data.", 200, 100);
				        }
				        
				        
				        /********** GAUGE *************/
				        var efficiency = (counts['Opportunities']/counts['Leads']) * 100.00;
				        var sales = (counts['Orders']/counts['Opportunities']) * 100.00;
				        
				        var gauge2 = new RGraph.Gauge(canvasGaugeId, 0, 100, [efficiency,sales]);
			            
			            gauge2.Set('chart.title.top.color', 'white');
			            gauge2.Set('chart.title.top', 'efficiency');
			            gauge2.Set('chart.title.bottom.color', '#d66');
			            gauge2.Set('chart.title.bottom', '% sales');
			            gauge2.Set('chart.title.bottom.pos', 0.2);
			            gauge2.Set('chart.title.bottom.size', 10);
			            gauge2.Set('chart.title.top.size', 15);
			            
			            gauge2.Set('chart.background.color', 'black');
			            gauge2.Set('chart.background.gradient', true);
			            gauge2.Set('chart.centerpin.color', '#666');
			            gauge2.Set('chart.needle.colors', [RGraph.RadialGradient(gauge2, 125, 125, 0, 125, 125, 25, 'transparent', 'white'),
			                                               RGraph.RadialGradient(gauge2, 125, 125, 0, 125, 125, 25, 'transparent', '#d66')]);
			            gauge2.Set('chart.needle.size', [null, 50]);
			            gauge2.Set('chart.text.color', 'white');
			            gauge2.Set('chart.tickmarks.small', 50);
			            gauge2.Set('chart.tickmarks.big',10);
			            gauge2.Set('chart.tickmarks.big.color', 'white');
			            gauge2.Set('chart.tickmarks.medium.color', 'white');
			            gauge2.Set('chart.tickmarks.small.color', 'white');
			            gauge2.Set('chart.border.outer', '#666');
			            gauge2.Set('chart.border.inner', '#333');
			            gauge2.Set('chart.colors.ranges', []);
			            
			            gauge2.Set('bevel', true);
			            gauge2.Draw();
			            /********** END OF GAUGE *************/
			            
			            $("#loading").hide();
			            $("#heroContainer").fadeIn("slow");
	
					});
				});
			});
		});
	};

	self.showTaskProgress = function(){
		var canvasId = "cvsProgress";
	    var canvas = document.getElementById(canvasId);
	    var context = canvas.getContext('2d');
	    context.clearRect(0, 0, canvas.width, canvas.height);
		
		RGraph.ObjectRegistry.Clear(canvasId);
		RGraph.Reset($("#" + canvasId));
		
		$.getJSON(CRM_URL + "task/", function(tasks){
			var data = _.pluck(tasks,"Status");
			
			var counts = {};
			_.each(data, function(e){
				counts[e] = counts[e]? counts[e]+1: 1; 
			});
			
			statusCounts = [counts["Not Started"], counts["In Progress"], counts["Completed"]];
		    var total = _.reduce(_.values(counts), function(memo, num){ return memo + num; }, 0);
		    var data = _.map(statusCounts, function(item){ return isFinite((item/total) * 100.00)?parseFloat(((item/total) * 100.00).toFixed(2)):0; });
		    
		    if(data.length){
			    var progress = new RGraph.HProgress(canvasId,data, 100);
			    progress.Set('colors', ['Gradient(#ccf:blue)', 'Gradient(white:white:yellow)', 'gradient(white:white:white:green)']);
			    progress.Set('key', ['Not Started (' + data[0] + '%)', 'In Progress (' + data[1] + '%)', 'Completed (' + data[2] + '%)']);
			    progress.Set('key.colors', ['blue','yellow','green']);
			    progress.Set('tooltips', ['Not Started (' + data[0] + '%)', 'In Progress (' + data[1] + '%)', 'Completed (' + data[2] + '%)']);
			    progress.Set('units.post', '%');
			    progress.Set('tickmarks.zerostart', true);
			    progress.Set('bevel', true);
			    progress.Draw();
		    }
		});
		
	    /*var pie = new RGraph.Pie(canvasId, _.values(counts));
	    pie.Set('chart.strokeStyle', '#FFFFFF');
	    pie.Set('chart.colors', ['#DDDF0D','#7798BF']);
	    pie.Set('chart.linewidth', 3);
	    pie.Set('chart.exploded', [15,]);
	    pie.Set('chart.shadow', true);
	    pie.Set('chart.shadow.offsetx', 0);
	    pie.Set('chart.shadow.offsety', 0);
	    pie.Set('chart.shadow.blur', 20);
	    pie.Set('chart.labels', _.keys(counts));
	    pie.Set('chart.labels.sticks', [true]);
	    pie.Set('chart.labels.sticks.length', 20);
	    
	    RGraph.Effects.Pie.RoundRobin(pie);*/
	};
	
	self.loadData = function(){
		self.showTaskProgress();
		self.showFunnelChart();
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
	
	$('#nav-report').addClass("active");
});	
