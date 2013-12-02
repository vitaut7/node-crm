var contact_keys = common.getFields(Contact);
var filter_array = common.getStringFields(Contact);
var required_contact_keys = common.getRequiredFields(Contact);
var required_account_keys = common.getRequiredFields(Account);
var subscription_keys = common.getFields(Subscription);

// Fields that can be updated for Contact/Account
var contact_update_keys = contact_keys; //["Phone", "Address", "City", "Optional"];

function isContactSubscribed(req, contact_id, callback) {
	// Check if account is subscribed by contact
	console.log('\nGET All Subscription Records for ' + req.session.Contact_Id);
	Subscription.find({Contact_Id: req.session.Contact_Id}, function(err, result) {
		if (err) {
			console.log(err);
			res.jsonp("");
		} else {
			if( (result != null) || req.session.isCompanyManager) {
				console.log("Subscribed Accounts: " + JSON.stringify(result));
				
				accounts = _.pluck(result, "Account_Id");
				if (_.contains(accounts, contact_id)) {
					//Account is in the subscription
					callback(true);
				} else {
					// Check if it's a Company Manager, if so get all company contacts and check if contact_id is in that list
					if(parseInt(req.session.isCompanyManager) === 1) {
						if((!_.isUndefined(req.session.Company_Code)) && req.session.Company_Code) {
							var options = {"Company_Code" : req.session.Company_Code };
							console.log('\nGET All Contacts that belong to same Company');
							Login.find(options, function(err, data) {
								if (err) {
									console.log(err);
									callback(false);
								} else {
									console.log(data);
									if ( (data != null ) && data.length) {
										var contacts = _.pluck(data,"Contact_Id");
										if(_.contains(contacts,contact_id)) 
											return callback(true);
										else 
											callback(false);
									} else 
										callback(false);
								}
							});
						} else 
							callback(false);
					} else 
						callback(false);
				}
			}
		}
	});
}

/*
 * GET Contact Record NOTE: Before retrieving the Contact Record, a check is
 * performed if it is on Logged in User's contact list.
 */
exports.getContact = function(req, res) {
	req.onValidationError(function(msg) {
		// Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	account = req.params.account;

	var errorMsg = {status: "Not Found"};

	// Check if account is subscribed by contact
	isContactSubscribed(req, account, function(isSubscribed){
		if(isSubscribed){
			// Retrieve from Account Table the Records for requested
			// account
			console.log('\nGet Contact Record: ' + account);
			Contact.findOne({_id: account},function(err, result) {
				if (err) {
					console.log(err);
					res.jsonp(500, errorMsg);
				} else {
					console.log(result);
					if (result !== null) {
						res.jsonp(result);
					} else {
						res.jsonp("");
					}
				}
			});
		} else 
			res.jsonp("");
	});

				
};

function allSubscribedContacts(req, callback){
	contact = req.session.Contact_Id;

	// If parameter is defined, use Contact_Id from it
	if(req.params.account)
		contact = req.params.account;
	
	console.log('\nGET All Subscribed Contact Records for ' + contact);
	Subscription.find({Contact_Id: contact}, function(err, result) {
		if (err) {
			console.log(err);
			callback("");
		} else {
			console.log(result);
			if(result != null) {
				var contactEntries = result;
				async.forEachSeries(contactEntries, getContactInfo, function(err) {
					callback(contactEntries);
				});
			} else {
				callback("");
			}
		}
	});
}

exports.getContacts = function(req,res){
	// Get Contact's Company Name
	contact = req.session.Contact_Id;
	
	if((!_.isUndefined(req.session.Company_Name)) && req.session.Company_Name ) {
		company_name = req.session.Company_Name;
		// Select All Contacts from Subscription whose company name is not above
		allSubscribedContacts(req, function(result){
			if(result.length){
				filteredContacts = _.filter(result, function(item){
						return (parseInt(item.isVerified) === 0);
					});
				res.jsonp(filteredContacts);
			} else {
				res.jsonp("");
			}
		});
	} else res.jsonp("");	
};

function getTeamInfo(contact, done){
	// Only display the following details about the contact from Login Table
	
	// Retrieve Contact Details
	console.log('\nGet Team Record: ' + contact.Contact_Id);
	Contact.findOne({ _id: contact.Contact_Id},function(err, data){
		if(err) {
			console.log(err);
			done();
		} else {
			console.log(data);
			if(data != null){
				data = data.toObject();
				// Use Email_Address from Login and not Contact for Team members
				delete data["_id"];
				delete data["__v"];
				delete data["Email_Address"];
				_.extend(contact,data);
				done();
			} else {
				done();
			}	
		}
	});
}

function getSelfInfo(contact_id, callback){
	console.log('\nGet Self Record: ' + contact_id);
	Login.findOne({Contact_Id: contact_id}, function(err, result) {
		if (err) {
			console.log(err);
			callback("");
		} else {
			var contacts = [];
			
			console.log(JSON.stringify(result));
			if (result !== null) {
				result = result.toObject();
				delete result["_id"];
				delete result["__v"];
				delete result["Password"];
				delete result["Username"];
				delete result["isBanned"];
				delete result["isEmailVerified"];
				contacts.push(result);
				
				async.forEachSeries(contacts, getTeamInfo, function(err){
					callback(contacts);
				});
			} else callback("");
		}
	});
}

function getCompanyContacts(req, callback){
	isCompanyManager = (!_.isUndefined(req.session.isCompanyManager))?parseInt(req.session.isCompanyManager):0;
	isManager = req.session.isManager;
	companyContacts = null;
	self = req.query.self || 0;
	
	if((!_.isUndefined(req.session.Company_Code)) && req.session.Company_Code) {
		var options = {"Company_Code" : req.session.Company_Code};
		console.log('\nGET All Contacts that belong to same Company');
		Login.find(options, function(err, result) {
			if (err) {
				console.log(err);
				if (parseInt(self)) {
					getSelfInfo(req.session.Contact_Id, function(data){
						callback(data);
					});
				} else callback("");
			} else {
				console.log(result);
				if ((result != null) && result.length) {
					var contacts = _.map(result, function(r){ return r.toObject(); });
					if (!parseInt(self)) {
						contacts = _.filter(contacts,function(contact){
							if(contact.Contact_Id !== req.session.Contact_Id) return true;
							return false;
						});
					}
					// Return only partial result from Login Table
					_.each(contacts,function(contact){
						delete contact["Password"];
						delete contact["Username"];
						delete contact["isBanned"];
						delete contact["isEmailVerified"];
						contact.Company_Name = req.session.Company_Name;
					});
					
					async.forEachSeries(contacts, getTeamInfo, function(err){
						companyContacts = contacts;
						
						if(isCompanyManager){
							callback(companyContacts);
						} else if(isManager) {
							// If not company manager, get Contacts from Subscription who are subset of Company Contacts (above)
							
							allSubscribedContacts(req, function(result){
								console.log("\nCompany Contacts: " + JSON.stringify(contacts));
								
								if(result.length){
									subscribedContactIds = _.pluck(result,"Contact_Id");
									
									if (parseInt(self)) {
										subscribedContactIds.push(req.session.Contact_Id);
									}
									
									companyContactIds = _.pluck(companyContacts,"Contact_Id");
									
									filteredIds = _.intersection(subscribedContactIds, companyContactIds);
									
									filteredContacts = _.filter(companyContacts,function(item){
										return _.contains(filteredIds,item.Contact_Id);
									});
									
									callback(filteredContacts);
								} else {
									console.log("No Contacts");
									if (parseInt(self)) {
										getSelfInfo(req.session.Contact_Id, function(data){
											callback(data);
										});
									} else callback("");
								}
							});
						} else {
							console.log("Not a Manager");
							if (parseInt(self)) {
								getSelfInfo(req.session.Contact_Id, function(data){
									callback(data);
								});
							} else callback("");
						}
						
					});
				} else {
					console.log("No Company Contacts");
					if (parseInt(self)) {
						getSelfInfo(req.session.Contact_Id, function(data){
							callback(data);
						});
					} else callback("");
				}
			}
		});
	} else {
		console.log("Undefined Company Code");
		callback("");
	}
	
}

function getTeamMembers(account, req, callback){
	isManager = req.session.isManager;
	companyContacts = null;
	
	// Check if account is a subscription of user
	isContactSubscribed(req, account, function(isSubscribed){
		if((!_.isUndefined(req.session.Company_Code)) && req.session.Company_Code && isSubscribed) {
			var options = {"Company_Code" : req.session.Company_Code };
			console.log('\nGET All Contacts that belong to same Company');
			Login.find(options, function(err, result) {
				if (err) {
					console.log(err);
					callback("");
				} else {
					console.log(result);
					if ((result != null) && result.length) {
						var contacts = result;
						contacts = _.filter(contacts,function(contact){
							if(contact.Contact_Id !== req.session.Contact_Id) return true;
							return false;
						});
						
						// Return only partial result from Login Table
						_.each(contacts,function(contact){
							delete contact["_id"];
							delete contact["__v"];
							delete contact["Password"];
							delete contact["Username"];
							delete contact["isBanned"];
							delete contact["isEmailVerified"];
							contact.Company_Name = req.session.Company_Name;
						});
						
						async.forEachSeries(contacts, getTeamInfo, function(err){
							companyContacts = contacts;
							
							if(isManager) {
								// Get Contacts from Subscription who are subset of Company Contacts (above)
								
								allSubscribedContacts(req, function(result){
									console.log("Company Contacts: " + JSON.stringify(contacts));
									
									if(result.length){
										subscribedContactIds = _.pluck(result,"Contact_Id");
										companyContactIds = _.pluck(companyContacts,"Contact_Id");
										
										console.log("Subscribed: " + JSON.stringify(subscribedContactIds));
										console.log("Company: " + JSON.stringify(companyContactIds));
										
										filteredIds = _.intersection(subscribedContactIds, companyContactIds);
										
										filteredContacts = _.filter(companyContacts,function(item){
											return _.contains(filteredIds,item.Contact_Id);
										});
										
										callback(filteredContacts);
									} else {
										console.log("No Contacts");
										callback("");
									}
								});
							} else {
								console.log("Not a Manager");
								callback("");
							}
							
						});
					} else {
						console.log("No Company Contacts");
						companyContacts = "";
					}
				}
			});
		} else {
			console.log("Undefined Company Code");
			callback("");
		}
	});
}

exports.getTeamMembers = function (req, res){
	getTeamMembers(req.params.account, req, function(result){
		res.jsonp(result);
	});
};

function updateTeamSubscription(contact, done){
	// Check if the account is already subscribed,
	// If not add or delete it
	
	if(contact.Action === "PUT"){
		insertItem = {};
		insertItem.Contact_Id = contact.Contact_Id;
		insertItem.Account_Id = contact.Account_Id;
		
		console.log('\nInserting Subscription Record: Contact ' + contact.Contact_Id + ' Account ' + contact.Account_Id);
		s = new Subscriptin(insertItem);
		s.save(function(err, result) {
			if (err) {
				console.log(err);
				done();
			} else {
				console.log(result);
				done();
			}
		});
	} else if(contact.Action === "DELETE"){
		console.log('\nDeleting Subscription Record: Contact ' + contact.Contact_Id + ' Account ' + contact.Account_Id);
		Subscription.remove({Contact_Id: contact.Contact_Id, Account_Id: contact.Account_Id}, function(err) {
			if (err) {
				console.log(err);
				done();
			} else {
				console.log("Deleted.");
				done();
			}
		});
	} else done();
}

exports.updateTeamSubscription = function(req,res){
		account = req.params.account;
		memberArray = req.body.Members || [];
		isManager = req.session.isManager;

		var errorMsg = {status: "Not Found"};
		
		// Check if account is subscribed by contact
		isContactSubscribed(req, account, function(isSubscribed){
			// Verify each Contact_Ids belong to the same Company_Code and Insert to Subscription
			if((!_.isUndefined(req.session.Company_Code)) && req.session.Company_Code && isSubscribed) {
				var options = {"Company_Code" : req.session.Company_Code };
				console.log('\nGET All Contacts that belong to same Company');
				Login.find(options, function(err, result) {
					if (err) {
						console.log(err);
						res.jsonp(500, errorMsg);
					} else {
						console.log(result);
						if ((result != null) && result.length) {
							var contacts = _.pluck(result,"Contact_Id");
							
							membersToSubscribe = _.filter(memberArray,function(member){
								if(_.contains(contacts,member)) return true;
								else return false;
							});
							
							getTeamMembers(account, req, function(members){
								curMembers = _.pluck(members,"Contact_Id");
								
								console.log("\nMembers to Subscribe: " + JSON.stringify(membersToSubscribe));
								console.log("Current Team Members: " + JSON.stringify(curMembers));
								
								var updateMembersItem = [];
								
								var removeMembers = null;
								var addMembers = null;
								
								removeMembers = _.difference(curMembers, membersToSubscribe);
								addMembers = _.difference(membersToSubscribe, curMembers);
								
								addMembers = _.map(addMembers, function(member){
									return {Contact_Id: account, Account_Id: member, Action: "PUT"};
								});
								
								removeMembers = _.map(removeMembers, function(member){
									return {Contact_Id: account, Account_Id: member, Action: "DELETE"};
								});
								
								_.extend(updateMembersItem, addMembers);
								_.extend(updateMembersItem, removeMembers);
								
								console.log("Subscriptions to Insert: " + JSON.stringify(updateMembersItem));
								async.forEachSeries(updateMembersItem, updateTeamSubscription, function(err){
									res.jsonp({status: "ok"});
								});
							});
						} else
							res.jsonp(500, errorMsg);
					}
				});
			} else
				res.jsonp(500, errorMsg);
		});
};

exports.setManager = function(req,res){
	
	account = req.params.account;
	var errorMsg = {status: "Action failed."};
	
	isManager = parseInt(req.session.isManager);
	if(isManager) {
		// Retrieve company of the account and check if he belongs to the same company
		console.log('\nGet Login Record of Contact: ' + account);
		Login.findOne({Contact_Id: account}, function(err, result) {
			if (err) {
				console.log(err);
				res.jsonp(500, errorMsg);
			} else {
				console.log(result);
				if (result !== null) {
					var company_code = result.Company_Code || "";
					if(company_code === req.session.Company_Code){
						// Update isManager status to 1
						
						console.log("Updateing manager status...");
						customloginUpdateItem = {};
						customloginUpdateItem["isManager"] = 1;
						
						Login.update({Contact_Id: account}, customloginUpdateItem, {}, function(err, result) {
							if (err) {
								res.jsonp(500, errorMsg);
							} else {
								res.jsonp({status: "ok"});
							}
						});
					} else {
						res.jsonp(500, errorMsg);
					}
				} else {
					res.jsonp(500, errorMsg);
				}
			}
		});
	} else res.jsonp(500, errorMsg);
};

exports.unsetManager = function(req,res){
	
	account = req.params.account;
	var errorMsg = {status: "Action failed."};
	
	isManager = parseInt(req.session.isManager);
	if(isManager) {
		// Retreive company of the account and check if he belongs to the same company
		console.log('\nGet Contact Record: ' + account);
		Login.findOne({Contact_Id: account},function(err, result) {
			if (err) {
				console.log(err);
				res.jsonp(500, errorMsg);
			} else {
				console.log(result);
				if (result !== null) {
					var company_code = result.Company_Code || "";
					if(company_code === req.session.Company_Code){
						// Update isManager status to 1
						customloginUpdateItem = {};
						customloginUpdateItem["isManager"] = 0;
						Login.update({Contact_Id: account}, customloginUpdateItem, {}, function(err, result) {
							if (err) {
								res.jsonp(500, errorMsg);
							} else {
								res.jsonp({status: "ok"});
							}
						});
					} else {
						res.jsonp(500, errorMsg);
					}
				} else {
					res.jsonp(500, errorMsg);
				}
			}
		});
	} else res.jsonp(500, errorMsg);
};

exports.getCompanyContacts = function(req,res){
	getCompanyContacts(req, function(result){
		res.jsonp(result);
	});
};

exports.getAccounts = function(req,res){
	// Get Contact's Company Name
	contact = req.session.Contact_Id;
	
	if((!_.isUndefined(req.session.Company_Name)) && req.session.Company_Name ) {
		company_name = req.session.Company_Name;
		// Select All Contacts from Subscription whose company name is not above
		allSubscribedContacts(req, function(result){
			if(result.length){
				filteredContacts = _.filter(result, function(item){
						return (parseInt(item.isVerified) === 1); 
					});
				res.jsonp(filteredContacts);
			} else {
				res.jsonp("");
			}
		});
	} else res.jsonp("");
};

/*
 * Add Contact Record for Contact
 */
exports.addContact = function(req, res) {
	req.onValidationError(function(msg) {
		// Redirect the user with error 'msg'
	});

	// TODO - Check if Account already exists and is subscribed by Contact

	/** ** Step 1: Insert into Account Table ******* */
	contact = req.session.Contact_Id; 

	var errorMsg = { status : 'Not Found' };

	/** ** Step 1: Insert into Contact Table ******* */
	/*
	 * Filter request object keys that are keys of subscription attributes and
	 * have defined values
	 */
	
	var errorMsg = {status : 'Insert failed.'};
	
	var parameters = req.body;
	if ((!_.isUndefined(req.query)) && (!_.isNull(req.query)) && (!_.isEmpty(req.query))) {
		parameters = req.query;
	}

	var filtered_keys = _.filter(_.keys(parameters), function(key) {
		return _.contains(contact_keys, key) && !_.isUndefined(parameters[key]) && parameters[key];
	});

	var canInsertContactItem = true;
	if((parameters["Category"] === "Account") && ( ((!_.isUndefined(req.session.isManager)) && (parseInt(req.session.isManager) === 1)) || ((!_.isUndefined(req.session.isCompanyManager)) && (parseInt(req.session.isCompanyManager) === 1)))  ){
		_.each(required_account_keys, function(key){
			if(!_.contains(filtered_keys, key)) {
				canInsertContactItem = false;
			}
		});
	} else {
		_.each(required_contact_keys, function(key){
			if(!_.contains(filtered_keys, key)) {
				canInsertContactItem = false;
			}
		});
	}
	
	_.each(required_contact_keys, function(key){
		if(!_.contains(filtered_keys, key)) {
			canInsertContactItem = false;
		}
	});
	
	if(canInsertContactItem){
		
		// Pick request object values from filtered keys
		insertItem = _.pick(parameters, filtered_keys);
		insertItem["isVerified"] = 0;
		insertItem["Category"] = insertItem["Category"] || "Contact";
		
		if((parameters["Category"] === "Account") && ( ((!_.isUndefined(req.session.isManager)) && (parseInt(req.session.isManager) === 1)) || ((!_.isUndefined(req.session.isCompanyManager)) && (parseInt(req.session.isCompanyManager) === 1)))  ){
			insertItem["isVerified"] = 1;
		}
		
		// Sanitize
		_.each(filter_array, function(item){
			if( (!_.isUndefined(insertItem[item])) && insertItem[item]){
				insertItem[item] = filter(insertItem[item]);
			}
		});
		
		
		console.log('\nInserting Contact Record: ' + JSON.stringify(insertItem));
		var c = new Contact(insertItem);
		var account = c._id;
		c.save(function(err, result) {
			if (err) {
				console.log(err);
				res.jsonp(500, {status: "Key Error!"});
			} else {
				console.log(result);
	
				/** ** Step 2: Insert Into Subscription Table ******* */
				/*
				 * Filter request object keys that are keys of subscription
				 * attributes and have defined values
				 */
				
				var parameters = req.body;
				if ((!_.isUndefined(req.query)) && (!_.isNull(req.query)) && (!_.isEmpty(req.query))) {
					parameters = req.query;
				}
				
				var filtered_keys = _.filter(_.keys(parameters), function(key) {
					return _.contains(subscription_keys, key) && !_.isUndefined(parameters[key]) && parameters[key];
				});
	
				// Pick request object values from filtered keys
				insertItem = _.pick(parameters, filtered_keys);
				insertItem["Contact_Id"] = contact;
				insertItem["Account_Id"] = account;
					
				console.log('\nInserting Subscription Record: ' + JSON.stringify(insertItem));
				s = new Subscription(insertItem);
				s.save(function(err, result) {
					if (err) {
						console.log(err);
						res.jsonp(500, errorMsg);
					} else {
						console.log(result);
						res.jsonp({status: "ok", id: account});
					}
				});
				/** ** End of Step 2 ******* */
	
			}
		});
		/** ** End of Step 1 ******* */
		
	} else 
		res.jsonp(500, errorMsg);
	
};

function updateContactItem(res, account, customUpdateItem){
	var errorMsg = {status : 'Update failed.'};
	updateItem = customUpdateItem;
	
	/*
	// Filter out fields that can be updated for a contact
	var filtered_keys = _.filter(_.keys(customUpdateItem), function(key) {
		return _.contains(contact_update_keys, key) && !_.isUndefined(customUpdateItem[key]) && customUpdateItem[key];
	});
	
	updateItem = _.pick(customUpdateItem, filtered_keys);
	
	if(customUpdateItem['isVerified'] == '1'){
		updateItem['isVerified'] == 1;
		updateItem["Category"] = 'Account';
	}
	*/
	
	console.log('\Updating Contact Record for Contact: ' + JSON.stringify(updateItem));
	Contact.update({_id: account}, updateItem, {}, function(err, result) {
		if (err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			res.jsonp({status: "ok"});
		}
	});
}

/*
 * Update Contact Record iff it is subscribed
 */
exports.updateContact = function(req, res) {
	req.onValidationError(function(msg) {
		// Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	account = req.params.account; 

	var errorMsg = {status : 'Update failed.'};

	var parameters = req.body;
	if ((!_.isUndefined(req.query)) && (!_.isNull(req.query)) && (!_.isEmpty(req.query))) {
		parameters = req.query;
	}	
	
	// Filter request object keys that are keys of contact attributes
	var filtered_keys = _.filter(_.keys(parameters), function(key) {
		return _.contains(contact_keys, key);
	});

	// Pick request object values from filtered keys
	updateItem = _.pick(parameters, filtered_keys);

	// Sanitize
	_.each(filter_array, function(item){
		if( (!_.isUndefined(updateItem[item])) && updateItem[item]){
			updateItem[item] = filter(updateItem[item]);
		}
	});
	
	
	//if(updateItem['isVerified'] === '1'){
	//	updateItem["Category"] = 'Account';
	//}
	
	isManager = req.session.isManager;
	
	console.log("Contact Keys: ", contact_keys);
	console.log("Update Item: ", updateItem);
	
	// If it's not a manager, update contact from Subscription List
	// If it's a Company manager, update contact from Company List/Subscription List
	// If it's a Manager, update contact from Subscription List
	
	isContactSubscribed(req, account, function(isSubscribed){
		if(isSubscribed){
			updateContactItem(res, account, updateItem);
		} else
			res.jsonp(500, errorMsg);
			
	});

};

/*
 * Delete Contact Record If contact belongs to the same company it is only
 * unsubscribed
 */
exports.deleteContact = function(req, res) {
	req.onValidationError(function(msg) {
		// Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	account = req.params.account; 

	var errorMsg = {status : 'Delete failed.'};

	// Check if the contact is on Lead Table
	var options = { Account_Id: account };								
	console.log('\nGET All Lead Records for by Account ' + account);
	Lead.find(options,function(err, result){
		if(err) {
			console.log("Lead Error: " + err);
			res.jsonp(500, errorMsg);
		} else {
			if((result != null) && result.length) {
				console.log("Error: " + err);
				res.jsonp(500, {status : "Failed. Lead exists!"});
			} else {
				console.log('\nDelete Account Subscription Record: ' + account);
				Subscription.remove({Contact_Id: contact, Account_Id: account}, function(err) {
					if (err) {
						console.log(err);
						res.jsonp(500, errorMsg);
						return;
					} else {
						console.log("Deleted.");

						// Delete the contact if it doesn't exist on the Login Table
						console.log('\nCheck if contact exists on Login Table: '+ contact);
						Login.findOne({Contact_Id: contact}, function(err, contactResult) {
							if (err) {
								console.log(err);
								res.jsonp(500, { status : "Unknown error occurred!" });
							} else {
								// Check for No Record Found
								if(contactResult == null) {
									// Delete Contact from Contact Table
									console.log('\nDelete Contact Record: ' + JSON.stringify(account));
									Contact.remove({_id: account}, function(err,data) {
										if (err) {
											console.log(err);
											res.jsonp(500,errorMsg);
											return;
										} else {
											// Success
											res.jsonp({status: "ok"});
										}
									});
								} else {
									res.jsonp({status: "ok"});
								}
							}
						});
					}
				});
			}
		}
	});
};

function getContactInfo(contact, done) {
	delete contact['Contact_Id'];
	// Retrieve Contact Details
	console.log('\nGet Contact Record: ' + contact.Account_Id);
	Contact.findOne({_id: contact.Account_Id }, function(err, data) {
		if (err) {
			console.log(err);
			done();
		} else {
			console.log(data);
			if (data !== null) {
				delete contact['Account_Id'];
				_.extend(contact, data);
				done();
			} else {
				done();
			}
		}
	});
}

var count = 0;
function insertImportedContact(line, done){
	var contact = line.split(',');
	_.map(contact, function(item){
		item.trim();
	});
	
	var contactItem = {};

	contactItem.isVerified = parseInt(contact[2]); // Third field is isVerified
	
	if(contact[3]) { // if Name is defined
		contactItem.Name = sanitize(contact[3]).str;
		
		if(contact[4]) {
			try {
			    check(contact[4]).isEmail();
			    contactItem.Email_Address = contact[4];
			} catch (e) {
			    console.log("Error: " + e.message); //Invalid Email
			    done();
			}
		}
		
		if(contact[5]) contactItem.Phone = contact[5];
		if(contact[6]) contactItem.Company_Name = sanitize(contact[6]).str;
		
		console.log('\nInserting Imported Contact Record: ', contactItem);
		
		var c = new Contact(contactItem);
		var account = c._id;
		c.save(function(err, result) {
			if(err){
				console.log("Error", err);
				done();
			}

			// Insert Into Subscription Table
			subscriptionItem = {};
			subscriptionItem.Contact_Id = contact[0];
			subscriptionItem.Account_Id = account;
			console.log('\nInserting Imported Contact Subscription Record: ' + JSON.stringify(subscriptionItem));
			var s = new Subscription(subscriptionItem);
			s.save(function(err, result) {
				done();
			});
		});
	} else {
		done();
	}

}

exports.importContact = function(req,res){
	
	if((!_.isUndefined(req.files)) && (!_.isUndefined(req.files.importfile))) {
		console.log("Uploaded Item: " + JSON.stringify(req.files.importfile));
		var contacts = fs.readFileSync(req.files.importfile.path).toString().trim().split(/\r\n|\r|\n/g);
		
		if((!_.isUndefined(req.body.Category)) && (req.body.Category === "Account")) {
			contacts = _.map(contacts, function(item){
				return req.session.Contact_Id + ",000,1," + item.trim();
			});
			
			console.log("Contacts: " + JSON.stringify(contacts));
			
			async.forEachSeries(contacts, insertImportedContact, function(err){
				console.log("Contacts Inserted: " + JSON.stringify(contacts));
				res.jsonp({status: "ok"});
			});
		} else if((!_.isUndefined(req.body.Category)) && (req.body.Category === "Contact")) {
			contacts = _.map(contacts, function(item){
				return req.session.Contact_Id + ",000,0," + item.trim();
			});
			
			console.log("Contacts: " + JSON.stringify(contacts));
			
			async.forEachSeries(contacts, insertImportedContact, function(err){
				console.log("Contacts Inserted: " + JSON.stringify(contacts));
				res.jsonp({status: "ok"});
			});
		} else res.jsonp(500,{status: "Unknown error!"});
	} else res.jsonp(500,{status: "Undefined error!"});
	

};
