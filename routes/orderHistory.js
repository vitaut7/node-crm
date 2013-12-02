var order_history_keys = common.getFields(OrderHistory);
var filter_array = common.getStringFields(OrderHistory);

/*
 * GET Order History Record
 */
exports.getOrderHistory = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	order = req.params.order; 
	id = req.params.id; 
	
	var errorMsg = {status: "Not Found"};
	
	console.log('\nGet Order History Record: ' + order);
	OrderHistory.findOne({Order_Id: order, _id: id}, function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			if(result !== null){
				result = result.toObject();
				res.jsonp(result);
			} else {
				res.jsonp("");
			}
		}
	});
	
};

/*
 * Add Order History Record
 */
exports.addHistory = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});
	
	order = req.params.order;
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
		return _.contains(order_history_keys,key) && !_.isUndefined(parameters[key]) && parameters[key];
	});
	
	// Pick request object values from filtered keys
	insertItem = _.pick(parameters,filtered_keys);
	insertItem["Order_Id"] = order;
	insertItem["Contact_Id"] = contact;
	insertItem["Timestamp"] = ((new Date()).getTime() + ((new Date()).getTimezoneOffset() * 60000));
	
	// Sanitize
	_.each(filter_array, function(item){
		if( (!_.isUndefined(insertItem[item])) && insertItem[item]){
			insertItem[item] = filter(insertItem[item]);
		}
	});
	
	var errorMsg = {status: 'Insert failed.'};

	console.log('\nInserting Order History Record: ' + JSON.stringify(insertItem));
	var oh = new OrderHistory(insertItem);
	var id = oh._id;
	oh.save(function(err, result){
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
 * Update Order History Record
 */
exports.updateHistory = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	order = req.params.order; 
	contact = req.session.Contact_Id;
	id = req.params.id; 
	
	var parameters = req.body;
	if ((!_.isUndefined(req.query)) && (!_.isNull(req.query)) && (!_.isEmpty(req.query))) {
		parameters = req.query;
	}

	// Filter request object keys that are keys of id attributes 
	var filtered_keys = _.filter(_.keys(parameters), function(key){
		return _.contains(order_history_keys,key);
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
	
	console.log('\Updating Order History Record: ' + JSON.stringify(updateItem));
	OrderHistory.update({Order_Id: order, _id: id}, updateItem,{},function(err, result){
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
 * Delete Order History Record
 */
exports.deleteHistory = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	order = req.params.order; 
	contact = req.session.Contact_Id;
	id = req.params.id; 
	
	var errorMsg = {status: 'Delete failed.'};
	
	if(req.session.isManager || req.session.isCompanyManager) {
		console.log('\nDelete Order History Record: ' + order);	
		OrderHistory.remove({Order_Id: order, _id: id}, function(err, result){
			if(err) {
				console.log(err);
				res.jsonp(500, errorMsg);
			} else {
				console.log(result);
				res.jsonp({status: "ok"});
			}
		});
	} else res.jsonp(500, {status: "Insufficient rights to perform this operation"});
};

function getContactInfo(contact, done){
	//var created = new Date();
	//created.setTime(contact.Timestamp);
	//contact["Created"] = (created.getFullYear()) + '-' + ('0' + (created.getMonth() + 1)).substr(-2, 2) + '-' + ('0' + created.getDate()).substr(-2, 2);
	
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
 * Get All Order History Records
 */
exports.getAll = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	order = req.params.order; 
	
	var errorMsg = {status: 'Not Found'};
	
	console.log('\nGET All Order History Records for Order ' + order);
	OrderHistory.find({Order_Id: order}, function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			if( result != null) {
					var orderHistory = _.map(result, function(r){ return r.toObject(); });
					async.forEachSeries(orderHistory, getContactInfo, function(err){
						res.jsonp(orderHistory);
						return;
					});
			} else res.jsonp("");
		}
	});
};