var order_keys = common.getFields(Order);
var filter_array = common.getStringFields(Order);

/*
 * GET Order Record
 */
exports.getOrder = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	order = req.params.order; 
	
	var errorMsg = { "error" : 'Not Found' };
	
	console.log('\nGet Order Record: ' + order);
	Order.findOne({Contact_Id: contact, _id: order}, function(err, result){
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
 * Add Order Record
 */
exports.addOrder = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});
	
	contact = req.session.Contact_Id; 
	
	/*
	 * Filter request object keys that are keys of order attributes and
	 * have defined values 
	 */
	
	var parameters = req.body;
	if ((!_.isUndefined(req.query)) && (!_.isNull(req.query)) && (!_.isEmpty(req.query))) {
		parameters = req.query;
	}
	
	var filtered_keys = _.filter(_.keys(parameters), function(key){
		return _.contains(order_keys,key) && !_.isUndefined(parameters[key]) && parameters[key];
	});
	
	// Pick request object values from filtered keys
	insertItem = _.pick(parameters,filtered_keys);
	insertItem["Contact_Id"] = contact;
	insertItem["Order_Date"] = ((new Date()).getTime() + ((new Date()).getTimezoneOffset() * 60000));
	//insertItem["Order_Deadline"] = ((new Date()).getTime() + ((new Date()).getTimezoneOffset() * 60000));
	insertItem["Order_Deadline"] = "Not Available";
	
	// Sanitize
	_.each(filter_array, function(item){
		if( (!_.isUndefined(insertItem[item])) && insertItem[item]){
			insertItem[item] = filter(insertItem[item]);
		}
	});
	
	var errorMsg = {status: 'Insert failed.'};
	
	console.log('\nInserting Order Record: ' + JSON.stringify(insertItem));
	var o = new Order(insertItem);
	var order = o._id;
	o.save(function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			// Insert Order History
			var orderhistory = {};
			orderhistory.Order_Id = order;
			//orderhistory.Id = uuid.v1();
			orderhistory.Timestamp = ((new Date()).getTime() + ((new Date()).getTimezoneOffset() * 60000));
			orderhistory.Comment = "New order added.";
			orderhistory.Contact_Id = contact;
			
			console.log('\nInserting Order History Record: ' + JSON.stringify(orderhistory));
			oh = new OrderHistory(orderhistory);
			oh.save(function(err, result){
				if(err) {
					// There was an error inserting to history table
					// but since previous Order insertion was successful, we reply with OK.
					console.log(err);
					res.jsonp({status: "ok", id: order});
				} else {
					console.log(result);
					res.jsonp({status: "ok", id: order});
				}
			});
		}
	});
	
};

/*
 * Update Order Record
 */
exports.updateOrder = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	order = req.params.order; 
	
	var parameters = req.body;
	if ((!_.isUndefined(req.query)) && (!_.isNull(req.query)) && (!_.isEmpty(req.query))) {
		parameters = req.query;
	}	
	
	// Filter request object keys that are keys of order attributes 
	var filtered_keys = _.filter(_.keys(parameters), function(key){
		return _.contains(order_keys,key);
	});
	
	// Pick request object values from filtered keys
	updateItem = _.pick(parameters,filtered_keys);
	
	// Sanitize
	_.each(filter_array, function(item){
		if( (!_.isUndefined(updateItem[item])) && updateItem[item]){
			updateItem[item] = filter(updateItem[item]);
		}
	});
	
	console.log('\Updating Order Record: ' + JSON.stringify(updateItem));
	Order.update({Contact_Id: contact, _id: order} , updateItem,{},function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, {status: "Key Error!"});
		} else {
			//If Status/Description was updated, insert record in Order History
			var orderhistory = {};
			orderhistory.Order_Id = order;
			//orderhistory.Id = uuid.v1();
			orderhistory.Timestamp = ((new Date()).getTime() + ((new Date()).getTimezoneOffset() * 60000));
			orderhistory.Contact_Id = contact;
			orderhistory.Comment = "";
			var insertHistory = false;
			if((!_.isUndefined(updateItem["Description"])) && updateItem["Description"]) {
				orderhistory.Comment = orderhistory.Comment + "Description updated to: " + updateItem["Description"] + ". ";
				insertHistory = true;
			}
			if((!_.isUndefined(updateItem["Status"])) && updateItem["Status"]) {
				orderhistory.Comment = orderhistory.Comment + "Status updated to: " + updateItem["Status"] + ".";
				insertHistory = true;
			}

			if((!_.isUndefined(updateItem["Order_Deadline"])) && updateItem["Order_Deadline"]) {
				orderhistory.Comment = orderhistory.Comment + "Deadline updated to: " + updateItem["Order_Deadline"] + ".";
				insertHistory = true;
			}

			if((!_.isUndefined(updateItem["Quantity"])) && updateItem["Quantity"]) {
				orderhistory.Comment = orderhistory.Comment + "Quantity updated to: " + updateItem["Quantity"] + ".";
				insertHistory = true;
			}			
			
			if(insertHistory){
				console.log('\nInserting Order History Record: ' + JSON.stringify(orderhistory));
				oh = new OrderHistory(orderhistory);
				oh.save(function(err, result){
					if(err) {
						// There was an error inserting to history table
						// but since previous Order insertion was successful, we reply with OK.
						console.log(err);
						res.jsonp({status: "ok", id: order});
					} else {
						console.log(result);
						res.jsonp({status: "ok", id: order});
					}
				});
			} else {
				console.log(result);
				res.jsonp({status: "ok"});
			}
		}
	});
};

function deleteHistory(orderHistory, done){
	console.log('\nDelete Order History Record: ' + orderHistory.Order_Id);	
	OrderHistory.remove({Order_Id: orderHistory.Order_Id, _id: orderHistory.Id}, function(err, result){
		if(err) {
			done();
		} else {
			done();
		}
	});
}

/*
 * Delete Order Record
 */
exports.deleteOrder = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	order = req.params.order; 
	
	var errorMsg = { "status" : 'Not Found' };
	
	if(req.session.isManager || req.session.isCompanyManager) {
		console.log('\nDelete Order Record: ' + order);	
		Order.remove({Contact_Id: contact, _id: order}, function(err){
			if(err) {
				console.log(err);
				res.jsonp(500, errorMsg);
			} else {
				// Also delete Order History
				// First scan and then delete each record
				console.log('\nGET All Order History Records for Order ' + order);
				OrderHistory.find({Order_Id: order}, function(err, result){
					if(err) {
						console.log(err);
						res.jsonp(500, errorMsg);
					} else {
						// Iterate each history record and delete
						console.log(result);
						if(result != null) {
								var orderHistory = result;
								async.forEachSeries(orderHistory, deleteHistory, function(err){
									console.log(result);
									res.jsonp({status: "ok"});
								});
						} else res.jsonp({status: "ok"});
					}
				});
			}
		});
	} else
		res.jsonp(500, {status: "Insufficient rights to perform this operation"});
};

function getProductInfo(order, done) {
	// Retrieve Product Details
	if ((_.isUndefined(order.Product_Id)) || !order.Product_Id) {
		done();
	} else {
		console.log('\nGet Product Record: ' + order.Product_Id);
		Product.findOne({Contact_Id: order.Contact_Id, _id: order.Product_Id}, function(err,productData) {
			if (err) {
				console.log(err);
				done();
			} else {
				console.log(productData);
				if (productData !== null) {
					productData = productData.toObject();
					delete productData["id"];
					delete productData["_id"];
					delete productData["__v"];
					delete productData["Customer_Id"];
					
					_.extend(order, productData);
					
					if ((_.isUndefined(order.Customer_Id))	|| !order.Customer_Id) {
						done();
					} else {
							// Retrieve Contact Details
							console.log('\nGet Contact Record: ' + order.Customer_Id);
							Contact.findOne({_id: order.Customer_Id} ,function(err, contactData){
								if(err) {
									console.log(err);
									done();
								} else {
									console.log(contactData);
									if((contactData != null) && contactData.length){
										contactData = contactData.toObject();
										delete contactData.Contact_Id;
										delete contactData["id"];
										delete contactData["_id"];
										delete contactData["__v"];
										_.extend(order,contactData);
										done();
									} else {
										_.extend(order,{Name: "Unknown"});
										done();
									}
								}
							});
					}
				} else done();
			}
		});
	}
}

/*
 * Get All Order Records By Contact
 */
exports.getAll = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	
	var errorMsg = { "status" : 'Not Found' };
	
	console.log('\nGET All Order Records for Contact');
	Order.find({Contact_Id: contact},function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			if(result != null) {
					var orders = _.map(result, function(o){ return o.toObject(); });
					console.log("Order Object: ", orders);
					async.forEachSeries(orders, getProductInfo, function(err){
						res.jsonp(orders);
					});
			} else res.jsonp("");
		}
	});
};

/*
 * Get All Order Records By Contact, Status
 */
exports.getAllByStatus = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	status = req.params.status; 
	
	var errorMsg = { "status" : 'Not Found' };
	var options = {Contact_Id: contact, "Status": status };
	
	console.log('\nGET All Order Records for Contact');
	Order.find(options,function(err, result){
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

exports.getAllStatus = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	
	var status = [];
	
	status.push({"Status": "New"});
	status.push({"Status": "Payment Receipt"});
	status.push({"Status": "Completed"});
	
	res.jsonp(status);
};
