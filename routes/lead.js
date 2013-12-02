var lead_keys = common.getFields(Lead);
var filter_array = common.getStringFields(Lead);

/*
 * GET Lead Record
 */
exports.getLead = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	lead = req.params.lead; 
	
	var errorMsg = {status: "Not Found"};
	
	console.log('\nGet Lead Record: ' + lead);
	Lead.findOne({Contact_Id: contact, _id: lead}, function(err, result){
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
 * Add Lead Record
 */
exports.addLead = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});
	
	contact = req.session.Contact_Id;
	
	/*
	 * Filter request object keys that are keys of lead attributes and
	 * have defined values 
	 */
	
	var parameters = req.body;
	if ((!_.isUndefined(req.query)) && (!_.isNull(req.query)) && (!_.isEmpty(req.query))) {
		parameters = req.query;
	}

	var filtered_keys = _.filter(_.keys(parameters), function(key){
		return _.contains(lead_keys,key) && !_.isUndefined(parameters[key]) && parameters[key];
	});
	
	// Pick request object values from filtered keys
	insertItem = _.pick(parameters,filtered_keys);
	insertItem["Contact_Id"] = contact;
	insertItem["Status"] = "New";
	insertItem["Created"] = ((new Date()).getTime() + ((new Date()).getTimezoneOffset() * 60000));
	insertItem["Source"] = insertItem["Source"] || "Website";
	
	console.log("Lead Item: ", insertItem);
	
	// Sanitize
	_.each(filter_array, function(item){
		if( (!_.isUndefined(insertItem[item])) && insertItem[item]){
			insertItem[item] = filter(insertItem[item]);
		}
	});
	
	var errorMsg = {status: 'Insert failed.'};
	
	console.log('\nInserting Lead Record: ' + JSON.stringify(insertItem));
	var l = new Lead(insertItem);
	var lead = l._id;
	l.save(function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			// Insert Lead History
			var leadhistory = {};
			leadhistory.Lead_Id = lead;
			//leadhistory.Id = uuid.v1();
			leadhistory.Timestamp = ((new Date()).getTime() + ((new Date()).getTimezoneOffset() * 60000));
			leadhistory.Comment = "New lead added from source: " + insertItem["Lead_Source"] + ".";
			leadhistory.Contact_Id = contact;
			
			console.log('\nInserting Lead History Record: ' + JSON.stringify(leadhistory));
			lh = new LeadHistory(leadhistory);
			lh.save(function(err, result){
				if(err) {
					// There was an error inserting to history table
					// but since previous Lead insertion was successful, we reply with OK.
					console.log(result);
					res.jsonp({status: "ok", id: lead});
				} else {
					console.log(result);
					res.jsonp({status: "ok", id: lead});
				}
			});
		}
	});

	
};

/*
 * Update Lead Record
 */
exports.updateLead = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id;
	lead = req.params.lead;
	
	var parameters = req.body;
	if ((!_.isUndefined(req.query)) && (!_.isNull(req.query)) && (!_.isEmpty(req.query))) {
		parameters = req.query;
	}

	// Filter request object keys that are keys of lead attributes 
	var filtered_keys = _.filter(_.keys(parameters), function(key){
		return _.contains(lead_keys,key);
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
	
	console.log('\Updating Lead Record: ' + JSON.stringify(updateItem));
	Lead.update({Contact_Id: contact, _id: lead}, updateItem,{},function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			//If Status/Description was updated, insert record in Lead History
			var leadhistory = {};
			leadhistory.Lead_Id = lead;
			//leadhistory.Id = uuid.v1();
			leadhistory.Timestamp = ((new Date()).getTime() + ((new Date()).getTimezoneOffset() * 60000));
			leadhistory.Contact_Id = contact;
			leadhistory.Comment = "";
			var insertHistory = false;
			if((!_.isUndefined(updateItem["Lead_Source"])) && updateItem["Lead_Source"]) {
				leadhistory.Comment = leadhistory.Comment + "Lead source updated to: " + updateItem["Lead_Source"] + ". ";
				insertHistory = true;
			}	
			if((!_.isUndefined(updateItem["Description"])) && updateItem["Description"]) {
				leadhistory.Comment = leadhistory.Comment + "Description updated to: " + updateItem["Description"] + ". ";
				insertHistory = true;
			}
			if((!_.isUndefined(updateItem["Status"])) && updateItem["Status"]) {
				leadhistory.Comment = leadhistory.Comment + "Status updated to: " + updateItem["Status"] + ".";
				insertHistory = true;
			}
			
			if(insertHistory){
				console.log('\nInserting Lead History Record: ' + JSON.stringify(leadhistory));
				lh = new LeadHistory(leadhistory);
				lh.save(function(err, result){
					if(err) {
						// There was an error inserting to history table
						// but since previous Lead insertion was successful, we reply with OK.
						console.log(result);
						res.jsonp({status: "ok", id: lead});
					} else {
						console.log(result);
						res.jsonp({status: "ok", id: lead});
					}
				});
			} else {
				console.log(result);
				res.jsonp({status: "ok"});
			}
		}
	});
};

function deleteHistory(leadHistory, done){
	console.log('\nDelete Lead History Record: ' + leadHistory.Lead_Id);	
	LeadHistory.remove({Lead_Id: leadHistory.Lead_Id, _id: leadHistory.Id}, function(err){
		if(err) {
			done();
		} else {
			done();
		}
	});
}

/*
 * Delete Lead Record
 */
exports.deleteLead = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id;
	lead = req.params.lead;
	
	var errorMsg = {status: 'Delete failed.'};
	
	console.log('\nDelete Lead Record: ' + lead);	
	Lead.remove({Contact_Id: contact, _id: lead}, function(err){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			// Also delete Lead History
			// First scan and then delete each record
			console.log('\nGET All Lead History Records for Lead ' + lead);
			LeadHistory.find({Lead_Id: lead}, function(err, result){
				if(err) {
					console.log(err);
					res.jsonp(500, errorMsg);
				} else {
					// Iterate each history record and delete
					console.log(result);
					if(result != null) {
							var leadHistory = result;
							async.forEachSeries(leadHistory, deleteHistory, function(err){
								console.log(result);
								res.jsonp({status: "ok"});
							});
					} else res.jsonp({status: "ok"});
				}
			});			

		}
	});
};

/*
 * Get All Lead Records
 */
exports.getAll = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id;
	
	var errorMsg = {status: 'Not Found'};
	
	console.log('\nGET All Lead Records for Contact');
	Lead.find({Contact_Id: contact}, function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			if(result != null) {
					res.jsonp(result);
			} else res.jsonp("");
		}
	});
};

function getContactInfo(contact, done){
	//delete contact['Contact_Id'];
	
	// Retrieve Contact Details
	console.log('\nGet Contact Record: ' + contact.Account_Id);
	Contact.findOne({_id: contact.Account_Id}, function(err, data){
		if(err) {
			console.log(err);
			done();
		} else {
			console.log(data);			
			if(data !== null){
				//delete contact['Account_Id'];
				contact = _.extend(contact,{"Name": data.Name || "Unknown"});
				done();
			} else {
				done();
			}	
		}
	});
}

/*
 * Get All Lead Records by Status
 */
exports.getAllByStatus = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	status = req.params.status;
	
	var errorMsg = {status: 'Not Found'};
	var options = { "Contact_Id": contact, "Status": status};
	
	console.log('\nGET All Lead Records for Contact By Status ' + contact + " (" + status + ")");
	Lead.find(options, function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(JSON.stringify(result));
			if(result != null) {
					var leads = _.map(result, function(r){ return r.toObject(); });
					async.each(leads, getContactInfo, function(err){
						res.jsonp(leads);
					});
			} else res.jsonp("");
		}
	});
};