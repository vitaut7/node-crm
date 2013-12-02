var lead_history_keys = common.getFields(LeadHistory);
var filter_array = common.getStringFields(LeadHistory);

/*
 * GET Lead History Record
 */
exports.getLeadHistory = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	lead = req.params.lead; 
	id = req.params.id; 
	
	var errorMsg = {status: "Not Found"};
	
	console.log('\nGet Lead History Record: ' + lead);
	LeadHistory.findOne({Lead_Id: lead, _id: id }, function(err, result){
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
 * Add Lead History Record
 */
exports.addHistory = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});
	
	lead = req.params.lead;
	contact = req.session.Contact_Id;
	
	/*
	 * Filter request object keys that are keys of id attributes and
	 * have defined values 
	 */
	
	var parameters = req.body;
	if ((!_.isUndefined(req.query)) && (!_.isNull(req.query)) && (!_.isEmpty(req.query))) {
		parameters = req.query;
	}

	var filtered_keys = _.filter(_.keys(parameters), function(key){
		return _.contains(lead_history_keys,key) && !_.isUndefined(parameters[key]) && parameters[key];
	});
	
	// Pick request object values from filtered keys
	insertItem = _.pick(parameters,filtered_keys);
	insertItem["Lead_Id"] = lead;
	insertItem["Contact_Id"] = contact;
	insertItem["Timestamp"] = ((new Date()).getTime() + ((new Date()).getTimezoneOffset() * 60000));
	
	// Sanitize
	_.each(filter_array, function(item){
		if( (!_.isUndefined(insertItem[item])) && insertItem[item]){
			insertItem[item] = filter(insertItem[item]);
		}
	});
	
	var errorMsg = {status: 'Insert failed.'};
	
	console.log('\nInserting Lead History Record: ' + JSON.stringify(insertItem));
	var lh = new LeadHistory(insertItem);
	var id = lh._id;
	lh.save(function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			res.jsonp({status: "ok", id: id});
		}
	});
	
};

/*
 * Update Lead History Record
 */
exports.updateHistory = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	lead = req.params.lead; 
	contact = req.session.Contact_Id;
	id = req.params.id; 
	
	var parameters = req.body;
	if ((!_.isUndefined(req.query)) && (!_.isNull(req.query)) && (!_.isEmpty(req.query))) {
		parameters = req.query;
	}

	// Filter request object keys that are keys of id attributes 
	var filtered_keys = _.filter(_.keys(parameters), function(key){
		return _.contains(lead_history_keys,key);
	});
	
	// Pick request object values from filtered keys
	updateItem = _.pick(parameters,filtered_keys);
	updateItem["Contact_Id"] = contact;
	
	// Sanitize
	_.each(filter_array, function(item){
		if( (!_.isUndefined(updateItem[item])) && updateItem[item]){
			updateItem[item] = filter(updateItem[item]);
		}
	});
	
	var errorMsg = {status: 'Update failed.'};

	console.log('\Updating Lead History Record: ' + JSON.stringify(updateItem));
	
	LeadHistory.update({Lead_Id: lead, _id: id}, updateItem, {}, function(err, result){
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
 * Delete Lead History Record
 */
exports.deleteHistory = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	lead = req.params.lead; 
	contact = req.session.Contact_Id;
	id = req.params.id; 
	
	var errorMsg = {status: 'Delete failed.'};
	
	console.log('\nDelete Lead History Record: ' + lead);	
	LeadHistory.remove({Lead_Id: lead, _id: id}, function(err){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log("Deleted");
			res.jsonp({status: "ok"});
		}
	});
};

function getContactInfo(contact, done){
	//var created = new Date(0);
	//created.setUTCSeconds(parseInt(parseInt(contact.Timestamp)/1000));
	//contact["Created"] = (created.getFullYear()) + '-' + ('0' + (created.getMonth() + 1)).substr(-2, 2) + '-' + ('0' + created.getDate()).substr(-2, 2);
	//contact["Created"] = contact.Timestamp;
	
	// Retrieve Contact Details
	console.log('\nGet Contact Record: ' + contact.Contact_Id);
	Contact.findOne({_id: contact.Contact_Id}, function(err, data){
		if(err) {
			console.log(err);
			done();
		} else {
			console.log(data);
			if(data !== null){
				_.extend(contact,{"Created_By": data.Name});
				done();
			} else {
				done();
			}	
		}
	});
}

/*
 * Get All Lead History Records
 */
exports.getAll = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	lead = req.params.lead; 
	
	var errorMsg = {status: 'Not Found'};
	
	console.log('\nGET All Lead History Records for Lead ' + lead);
	LeadHistory.find({Lead_Id: lead}, function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			if(result != null) {
					var leadHistory = _.map(result, function(r){ return r.toObject(); });
					async.forEachSeries(leadHistory, getContactInfo, function(err){
						res.jsonp(leadHistory);
					});
			} else res.jsonp("");
		}
	});
};