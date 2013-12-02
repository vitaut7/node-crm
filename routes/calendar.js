var calendar_keys = common.getFields(Calendar);
var filter_array = common.getStringFields(Calendar);

/*
 * Get All Calendar Records By Contact
 */
exports.getAll = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	
	var errorMsg = { "error" : 'Not Found' };
	
	console.log('\nGET All Calendar records by Contact');
	Calendar.find({Contact_Id: contact}, function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			if(result != null) {
					var calendarEntries = result;
					_.each(calendarEntries, function (item){
						item["id"] = item.Calendar_Id;
					});
					res.jsonp(calendarEntries);
			} else res.jsonp("");			
		}
	});
};

/*
 * Add Calendar Record
 */
exports.addCalendar = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});
	
	contact = req.session.Contact_Id; 
	
	/*
	 * Filter request object keys that are keys of calendar attributes and
	 * have defined values 
	 */
	
	var parameters = req.body;
	if ((!_.isUndefined(req.query)) && (!_.isNull(req.query)) && (!_.isEmpty(req.query))) {
		parameters = req.query;
	}

	var filtered_keys = _.filter(_.keys(parameters), function(key){
		return _.contains(calendar_keys,key) && !_.isUndefined(parameters[key]) && parameters[key];
	});
	
	/***** Accept Calendar ID from client *****/
	//if(!_.isUndefined(parameters["id"])) {
	//	calendar = (/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/.test(parameters["id"]))?parameters["id"]:calendar;
	//}
	
	// Pick request object values from filtered keys
	insertItem = _.pick(parameters,filtered_keys);
	insertItem["Contact_Id"] = contact;
	
	// Sanitize
	_.each(filter_array, function(item){
		if( (!_.isUndefined(insertItem[item])) && insertItem[item] ){
			insertItem[item] = filter(insertItem[item]);
		}
	});
	
	var errorMsg = {status: 'Insert failed.'};
	
	console.log('\nInserting Calendar Record: ' + JSON.stringify(insertItem));
	var c = new Calendar(insertItem);
	var calendar = c._id;
	c.save(function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			res.jsonp({status: "ok", id: calendar});
		}
	});
};

/*
 * Update Calendar Record
 */
exports.updateCalendar = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	calendar = req.params.calendar; 
	
	var parameters = req.body;
	if ((!_.isUndefined(req.query)) && (!_.isNull(req.query)) && (!_.isEmpty(req.query))) {
		parameters = req.query;
	}

	// Filter request object keys that are keys of calendar attributes 
	var filtered_keys = _.filter(_.keys(parameters), function(key){
		return _.contains(calendar_keys,key);
	});
	
	// Pick request object values from filtered keys
	updateItem = _.pick(parameters,filtered_keys);
	
	// Sanitize
	_.each(filter_array, function(item){
		if( (!_.isUndefined(updateItem[item])) && updateItem[item]){
			updateItem[item] = filter(updateItem[item]);
		}
	});
	
	var errorMsg = {status: 'Update failed.'};
	
	console.log('\Updating Calendar Record: ' + JSON.stringify(updateItem));
	Calendar.update({Contact_Id: contact, _id: calendar}, updateItem, {}, function(err, result){
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
 * Delete Calendar Record
 */
exports.deleteCalendar = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	calendar = req.params.calendar;
	
	var errorMsg = {status: 'Delete failed.'};
	
	console.log('\nDelete Calendar Record: ' + calendar);	
	//calendar_search_object = _.extend(req.body, {Contact_Id: contact});
	//Calendar.remove(calendar_search_object, function(err){
	Calendar.remove({Contact_Id: contact, _id: calendar}, function(err){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log("Deleted.");
			res.jsonp({status: "ok"});
		}
	});
};