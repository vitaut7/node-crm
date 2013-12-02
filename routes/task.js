var task_keys = common.getFields(Task);
var filter_array = common.getStringFields(Task);

/*
 * GET Task Record
 */
exports.getTask = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	task = req.params.task; 
	
	var errorMsg = { "error" : 'Not Found' };
	
	console.log('\nGet Task Record: ' + contact);
	Task.findOne({Contact_Id: contact, _id: task}, function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			if(result !== null){
				res.jsonp(result);
			} else {
				res.jsonp("");
			}
		}
	});
	
};

/*
 * Add Task Record
 */
exports.addTask = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});
	
	contact = req.session.Contact_Id; 
		
	/*
	 * Filter request object keys that are keys of task attributes and
	 * have defined values 
	 */
	var parameters = req.body;
	if ((!_.isUndefined(req.query)) && (!_.isNull(req.query)) && (!_.isEmpty(req.query))) {
		parameters = req.query;
	}	
	
	var filtered_keys = _.filter(_.keys(parameters), function(key){
		return _.contains(task_keys,key) && !_.isUndefined(parameters[key]) && parameters[key];
	});
	
	// Pick request object values from filtered keys
	insertItem = _.pick(parameters,filtered_keys);
	insertItem["Contact_Id"] = contact;
	
	insertItem["Created"] = ((new Date()).getUTCFullYear()) + '-' + ('0' + ((new Date()).getUTCMonth() + 1)).substr(-2, 2) + '-' + ('0' + (new Date()).getUTCDate()).substr(-2, 2);
	insertItem["Deadline"] = ((new Date()).getUTCFullYear()) + '-' + ('0' + ((new Date()).getUTCMonth() + 1)).substr(-2, 2) + '-' + ('0' + (new Date()).getUTCDate()).substr(-2, 2);
	insertItem["Priority"] = "Medium";
	insertItem["Assigner_Id"] = contact;
	insertItem["Status"] = "Not Started";
	
	// Sanitize
	_.each(filter_array, function(item){
		if( (!_.isUndefined(insertItem[item])) && insertItem[item]){
			insertItem[item] = filter(insertItem[item]);
		}
	});
	
	var errorMsg = { "error" : 'Insert failed.' };
	
	console.log('\nInserting Task Record: ' + JSON.stringify(insertItem));
	var t = new Task(insertItem);
	task = t._id;
	t.save(function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			res.jsonp({status: "ok", id: task});
		}
	});
	
};

/*
 * Update Task Record
 */
exports.updateTask = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	task = req.params.task; 
	
	var parameters = req.body;
	if ((!_.isUndefined(req.query)) && (!_.isNull(req.query)) && (!_.isEmpty(req.query))) {
		parameters = req.query;
	}	
	
	// Filter request object keys that are keys of task attributes 
	var filtered_keys = _.filter(_.keys(parameters), function(key){
		return _.contains(task_keys,key);
	});
	
	// Pick request object values from filtered keys
	updateItem = _.pick(parameters,filtered_keys);
	
	// Sanitize
	_.each(filter_array, function(item){
		if( (!_.isUndefined(updateItem[item])) && updateItem[item]){
			updateItem[item] = filter(updateItem[item]);
		}
	});
	
	var errorMsg = { "error" : 'Update failed.' };
	
	console.log('\Updating Task Record: ' + JSON.stringify(updateItem));
	Task.update({Contact_Id: contact,_id: task}, updateItem,{},function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			res.jsonp({status: "ok"});
		}
	});
};

/*
 * Delete Task Record
 */
exports.deleteTask = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	task = req.params.task; 
	
	var errorMsg = { "error" : 'Delete failed' };
	
	console.log('\nDelete Task Record: ' + contact);	
	Task.remove({Contact_Id: contact, _id: task}, function(err){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log("deleted");
			res.jsonp({status: "ok"});
		}
	});
};

function getTaskInfo(task, done){
	var contact = task.Assigner_Id;
	
	if(!_.isUndefined(contact) && contact){
		// Retrieve Contact Details
		console.log('\nGet Assigner Record: ' + contact);
		Contact.findOne({_id: contact}, function(err, data){
			if(err) {
				console.log(err);
				done();
			} else {
				console.log("Assigner",data);
				if(data !== null){
					_.extend(task,{"Assigner": data.Name});
					
					console.log("Task: ", task);
					
					var related = task.Related_To;
					if(!_.isUndefined(related) && related){
						// Retrieve Contact Details
						console.log('\nGet Related Record: ' + related);
						Contact.findOne({_id: related},function(err, data){
							if(err) {
								console.log(err);
								done();
							} else {
								console.log(data);
								if(data != null){
									_.extend(task,{"Related_Name": data.Name || "Unknown"});
									done();
								} else {
									_.extend(task,{"Related_Name": "Unknown"});
									done();
								}	
							}
						});
					} else done();
				} else {
					done();
				}	
			}
		});
	} else done();
}

/*
 * Get All Task Records By Contact
 */
exports.getAll = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	
	var errorMsg = { "error" : 'Not Found' };
	//var options = {filter:{ "Contact_Id": {eq: contact } }};
	
	console.log('\nGET All Task Records for Company By Contact');
	Task.find({Contact_Id: contact}, function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			if(result != null) {
					var taskEntries = _.map(result, function(r){ return r.toObject(); });
					async.forEachSeries(taskEntries, getTaskInfo, function(err){
						res.jsonp(taskEntries);
						return;
					});
			} else res.jsonp("");			
		}
	});
};

/*
 * Get All Task Records By Contact, Status
 */
exports.getTaskByStatus = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id;
	status = req.params.status;
	
	var errorMsg = { "error" : 'Not Found' };
	var options = { Contact_Id: contact, "Status": status };
	
	console.log('\nGET All Task Records for Contact By Status');
	Task.find(options,function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			if(result != null) {
					res.jsonp(result);
			} else 	res.jsonp("");
		}
	});
};