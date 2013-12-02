var path = require('path');

var account_keys = common.getFields(Account);
var filter_array = common.getStringFields(Account);
var login_keys = common.getFields(Login);
var required_login_keys = common.getRequiredFields(Login);
var required_account_keys = common.getRequiredFields(Account);

var account_update_keys = [ "Name", "Phone" ];
var login_update_keys = ["Password", "Email_Address"];

//Fields that can be deleted during update operation
var canBeDeleted = ["Phone"];

var whoAmI = {};

exports.whoami = function(req, res) {
	if((!_.isUndefined(req.session)) && (!_.isUndefined(req.session.Contact_Id))) { 
			Contact_Id = req.session.Contact_Id;
	} // else return ERROR!
	
	var errorMsg = { status : 'Not Found' };
	
	console.log('\nGet Login Record: ' + Contact_Id);
	Login.findOne({Contact_Id: Contact_Id}, function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			if(result != null) {
					delete result["Password"];
					whoAmI.Contact_Id = Contact_Id;
					whoAmI.Username = result["Username"];
					whoAmI.Password = "*********";
					whoAmI.Email_Address = result["Email_Address"];
					whoAmI.AuthToken = result["token"];
					whoAmI.tokenExpiry = result["tokenExpiry"];
					//whoAmI.session = JSON.stringify(req.session);
					whoAmI.isManager = parseInt(result["isManager"]);
					whoAmI.Company_Name = req.session.Company_Name;
					whoAmI.Company_Code = req.session.Company_Code;
					
					//if(!_.isUndefined(req.session.isCompanyManager))
					//	whoAmI.isCompanyManager = parseInt(req.session.isCompanyManager);
					
					// Retrieve Contact Details
					console.log('\nGet Contact Record: ' + Contact_Id);
					Contact.findOne({_id: Contact_Id}, function(err, data){
						if(err) {
							console.log(err);
							res.jsonp(500, errorMsg);
						} else {
							console.log(data);
							if(data != null) {
								whoAmI.Name = data.Name || "Unknown";
								whoAmI.Phone = data.Phone || "";
								res.jsonp(whoAmI);
							} else {
								res.jsonp(500, errorMsg);
							}	
						}
					});
			} else {
				res.jsonp(500, errorMsg);
			}
		}
	});
};

/*
 * Add Account Record for Contact
 */
exports.addAccount = function(req, res) {
	req.onValidationError(function(msg) {
		// Redirect the user with error 'msg'
	});

	/** ** Step 1: Insert into Account Table ******* */
	var errorMsg = { status : 'Not Found' };

	/** ** Step 1: Insert into Contact Table ******* */
	/*
	 * Filter request object keys that are keys of subscription attributes and
	 * have defined values
	 */

	var parameters = req.body;
	if ((!_.isUndefined(req.query)) && (!_.isNull(req.query)) && (!_.isEmpty(req.query)) ) {
		parameters = req.query;
	}

	var filtered_account_keys = _.filter(_.keys(parameters), function(key) {
		return _.contains(account_keys, key) && !_.isUndefined(parameters[key]) && parameters[key];
	});

	var canInsertContactItem = true;
	try {
	    if(parameters["Email_Address"]) check(parameters["Email_Address"]).isEmail();
	} catch (e) {
		canInsertContactItem = false;
	}
	
	_.each(required_account_keys, function(key){
		if(!_.contains(filtered_account_keys, key)) {
			canInsertContactItem = false;
		}
	});
	
	//console.log("Can Insert: " + canInsertContactItem);
	
	if(canInsertContactItem){
		// Pick request object values from filtered keys
		insertItem = _.pick(parameters, filtered_account_keys);
		insertItem['Category'] = 'Account';
		
		// Check if Company_Name is passed on the Session.
		if ((!_.isUndefined(req.session.registration_company_code)) && req.session.registration_company_code){
				insertItem["Company_Name"] = req.session.registration_company_name;
		}
		
		// Sanitize
		_.each(filter_array, function(item){
			if( (!_.isUndefined(insertItem[item])) && insertItem[item]){
				insertItem[item] = filter(insertItem[item]);
			}
		});
		
		var errorMsg = {status : 'Insert failed.'};
	
		console.log('\nInserting Contact Record: ' + JSON.stringify(insertItem));
		
		var c = new Contact(insertItem);
		var account = c._id;
		
		c.save(function(err, result) {
			if (err) {
				console.log("Error: " + err);
				res.jsonp(500, errorMsg);
			} else {
				console.log("Inserted to Contact Table.");
	
				/** ** Step 2: Insert Into Login Table ******* */
				/*
				 * Filter request object keys that are keys of login
				 * and have defined values
				 */
				
				var filtered_keys = _.filter(_.keys(parameters), function(key) {
					return _.contains(login_keys, key) && !_.isUndefined(parameters[key]) && parameters[key];
				});			
				var canInsertLoginItem = true;
				_.each(required_login_keys, function(key){
					if(!_.contains(filtered_keys, key)) {
						canInsertLoginItem = false;
					}
				});
				
				if(canInsertLoginItem){
					var company_code = require('crypto').createHash('sha512').update(insertItem["Company_Name"] + ((new Date()).getTime() + ((new Date()).getTimezoneOffset() * 60000))).digest('hex').substr(1,6);

					loginItem = _.pick(parameters, filtered_keys);
					var loginPassword;
					
					if (common.emailRegistrationEnabled()){
						// Generate Password automatically
						loginPassword = common.generatePassword();
					} else {
						//// Use user supplied password
						loginPassword = loginItem.Password || common.generatePassword();
					}
					
					loginItem["Contact_Id"] = account; 
					loginItem.Username = loginItem.Username.toLowerCase();
					loginItem.Password = common.getPasswordHash(loginPassword);
					loginItem.Email_Address = loginItem.Email_Address.toLowerCase();
					loginItem.isBanned = 0;
					
					if (common.emailRegistrationEnabled()){
					loginItem.isEmailVerified = 0;
					} else {
						loginItem.isEmailVerified = 1;
					}
										
					loginItem.isManager = 0;
					loginItem.verifyToken = common.getToken();
					
					// Register a new company if Company Code is not defined and set the first user as Manager
					if ((!_.isUndefined(req.session.registration_company_code)) && req.session.registration_company_code){
						loginItem.Company_Code = req.session.registration_company_code;
					} else {
						loginItem.isManager = 1;
						loginItem.Company_Code = company_code;
					}
	
					// Check if Username/Email Address are duplicate
					var options = {"Username" : (parameters["Username"]).toLowerCase()};
	
					console.log('\nCheck duplicity of Username: ' + parameters["Username"] );
					Login.find(options, function(err, result) {
						if (err) {
							console.log(err);
							res.jsonp(500, errorMsg);
						} else {
							if((result != null ) && result.length){
								// Duplicate Username
								console.log("Error: Duplicate Username!");
								
								console.log('\nDeleting Contact Record: ' + JSON.stringify(insertItem));	
								Contact.remove({_id: c._id},function(err){
									res.jsonp(500,{status: "Duplicate Username!"});
								});
								
							} else{
								// Check if Email is duplicate
								var options = {"Email_Address" : (parameters["Email_Address"]).toLowerCase()};
				
								console.log('\nCheck duplicity of Email_Address: ' + parameters["Email_Address"] );
								Login.find(options, function(err, result) {
									if (err) {
										console.log(err);
										res.jsonp(500, errorMsg);
									} else {
										if(result && (result.length >= 1)){
											console.log("Error: Duplicate Email!");
											
											console.log('\nDeleting Contact Record: ' + JSON.stringify(insertItem));
											Contact.remove({_id: c._id},function(err, result){
												res.jsonp(500, {status: "Try a different email address!"});
											});
										} else {
											// Insert New Username
											
											//TODO - Valid email address loginItem["Email_Address"]
											console.log('\nInserting Login Record: ' + JSON.stringify(loginItem));
											l = new Login(loginItem);
											l.save(function(err, result) {
												if (err) {
													console.log("Error: " + err);
													console.log('\nDeleting Contact Record: ' + JSON.stringify(insertItem));	
													Contact.remove({_id: c._id}, function(err){
														res.jsonp(500, {status: "Unknown error!"});
													});
												} else {
													console.log("Inserted to Login Table " + result);
													
													// Generate and Insert Company Code in Company Table
													if (1 == loginItem.isManager){
														var company = {};
														company.Id = company_code;
														company.Company_Name = insertItem["Company_Name"];
														company.Manager_Id = account; 
														
														// Check if Company Name is duplicate
														var options = {"Company_Name": company.Company_Name };
				
														console.log('\nCheck duplicity of Company: ' + company.Company_Name );
														Company.find(options, function(err, result) {
															if (err) {
																console.log(err);
																res.jsonp(500, errorMsg);
															} else {
																if(result && (result.length >= 1)){
																	// Duplicate Company Name
																	console.log("Error: Duplicate Company Name!");
																	// Delete Contact and Login;
																	console.log('\nDeleting Login Record: ' + JSON.stringify(loginItem));	
																	Login.remove({Contact_Id: account},function(err){
																		console.log('\nDeleting Contact Record: ' + JSON.stringify(insertItem));	
																		Contact.remove({_id: c._id},function(err, result){
																			res.jsonp(500, {status : 'Company exists!'});
																		});
																	});
																} else {
																	// Insert New Company Code/Name
																	console.log('\nInserting Company Code: ' + JSON.stringify(insertItem["Company_Name"]));
																	c = new Company(company);
																	c.save(function(err, result) {
																		if (err) {
																			console.log("Error Inserting Company Code to Company Table: " + company_code);
																			// Delete Contact and Login;
																			console.log('\nDeleting Login Record: ' + JSON.stringify(loginItem));	
																			Login.remove({Contact_Id: account}, function(err, result){
																				console.log('\nDeleting Contact Record: ' + JSON.stringify(insertItem));	
																				Contact.remove({_id: c._id}, function(err, result){
																					res.jsonp(500, errorMsg);
																				});
																			});
																		} else {
																			
																			if (common.emailRegistrationEnabled()){
																				// Send Verification Mail
																				var toEmail = loginItem["Email_Address"];
																				var subject = "Node CRM - Verification ";
																				var body = "Thank you for registering to Node CRM. Your password is:<br/><br/>" + loginPassword + "<br/><br/>" +
																	    		"Please click on the following link to complete the registration.<br/><br/>" +
																	    		"<a href='" + CLIENTURL + CLIENTPORT + "/verify?token=" + loginItem.verifyToken +"' target='_blank'>" + CLIENTURL + CLIENTPORT + "verify?token=" + loginItem.verifyToken + "</a><br/><br/>" +
																	    		"or visit <a href='" + CLIENTURL + CLIENTPORT + "/verify' target='_blank'>" + CLIENTURL + CLIENTPORT + "/verify</a> and copy/paste following verification code<br/><br/>" + loginItem.verifyToken + "<br/><br/>" +
																	    		"If you did not register for the service or this mail was sent to you by mistake, please ignore the mail or safely delete it from the inbox." +
																	    		"<br/><br/>- Node CRM Team"; 
																				
																				common.sendEmail(toEmail, subject, body, function(error, response){
																				    if(error) {
																				    	// Problem sending mail 
																				    	
																				    	// Delete entry from Login and Contact Table
																				    	console.log("Mail Error: " + error);
																						console.log('\nDeleting Login Record: ' + JSON.stringify(loginItem));	
																						Login.remove({Contact_Id: account},function(err){
																							console.log('\nDeleting Contact Record: ' + JSON.stringify(insertItem));	
																							Contact.remove({_id: account}, function(err, result){
																								res.jsonp(500, {status: "Error creating account"});
																							});
																						});
																				    } else {
																						console.log("Message sent: " + response.message);
																						res.jsonp({status: "ok", id: account});
																				    }																				
																				});
																			} else{
																				res.jsonp({status: "ok", id: account});
																			}
																		}
																	});
																}
															}
														});
													} else {
														//res.jsonp({status: "ok", id: account});
														// Employee Registration (Not A Manager)
														
														if (common.emailRegistrationEnabled()){
															// Send Verification Mail
															var toEmail = loginItem["Email_Address"];
															var subject = "Node CRM - Verification ";	    
															var body = "Thank you for registering to Node CRM. Your password is:<br/><br/>" + loginPassword + "<br/><br/>" +
															    		"Please click on the following link to complete the registration.<br/><br/>" +
															    		"<a href='" + CLIENTURL + CLIENTPORT + "/verify?token=" + loginItem.verifyToken +"' target='_blank'>" + CLIENTURL + CLIENTPORT + "verify?token=" + loginItem.verifyToken + "</a><br/><br/>" +
															    		"or visit <a href='" + CLIENTURL + CLIENTPORT + "/verify' target='_blank'>" + CLIENTURL + CLIENTPORT + "/verify</a> and copy/paste following verification code<br/><br/>" + loginItem.verifyToken + "<br/><br/>" +
															    		"If you did not register for the service or this mail was sent to you by mistake, please ignore the mail or safely delete it from the inbox." +
															    		"<br/><br/>- Node CRM Team";
	
															common.sendEmail(toEmail, subject, body, function(error, response){
															    if(error) {
															    	// Problem sending mail 
															    	// Delete entry from Login and Contact Table
															    	console.log("Mail Error: " + error);
																	console.log('\nDeleting Login Record: ' + JSON.stringify(loginItem));	
																	Login.remove({Contact_Id: account},function(err){
																		console.log('\nDeleting Contact Record: ' + JSON.stringify(insertItem));	
																		Contact.remove({_id: account}, function(err){
																			res.jsonp(500, {status: "Error creating account"});
																		});
																	});
															    } else {
																	console.log("Message sent: " + response.message);
																	res.jsonp({status: "ok", id: account});
															    }
															});
														} else {
															res.jsonp({status: "ok", id: account});
														}
													}
												}
											});
										}
									}
								});
							}
						}
					});				
				} else {
					res.jsonp(500, {"status": "Insufficient Parameters! Please clear browser history and try again."});
				}
				/** ** End of Step 2 ******* */
			}
		});
		/** ** End of Step 1 ******* */
	} else {
		res.jsonp(500, {"status": "Insufficient Parameters."});
	}
};

/*
 * Update Contact Record iff it belongs to logged in user
 */
exports.updateAccount = function(req, res) {
	req.onValidationError(function(msg) {
		// Redirect the user with error 'msg'
	});

	contact = null;
	var errorMsg = {status : 'Update failed.'};

	var parameters = req.body;
	if ((!_.isUndefined(req.query)) && (!_.isNull(req.query)) && (!_.isEmpty(req.query))) {
		parameters = req.query;
	}
	
	contact = req.session.Contact_Id;
	
	// Filter request object keys that are keys of contact attributes
	var filtered_keys = _.filter(_.keys(parameters), function(key) {
		return _.contains(account_update_keys, key);
	});
	
	// Pick request object values from filtered keys
	updateItem = _.pick(parameters, filtered_keys);

	// Sanitize
	_.each(filter_array, function(item){
		if( (!_.isUndefined(updateItem[item])) && updateItem[item]){
			updateItem[item] = filter(updateItem[item]);
		}
	});
	
	//If Name or Company Name are updated, update session.
	
	emailUpdated = false;
	passwordUpdated = false;
	
	// Only update changed values
	console.log('\nGET All Records for Contact' + JSON.stringify(contact));
	Contact.findOne({_id: contact}, function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(JSON.stringify(result));
			if( result != null) {
					var contactDetails = result;
					console.log('\Updating Profile Record for Contact: ' + JSON.stringify(updateItem));
					Contact.update({_id: contact}, updateItem, {}, function(err, result) {
						if(!err) {
							//if(_.contains(updateItem,"Company_Name"))
							//	res.session.Company_Name = updateItem["Company_Name"];
							if(!_.isUndefined(updateItem["Name"]) && updateItem["Name"]){
								req.session.Name = updateItem["Name"];
							}
							// Update Login Table
							
							// Filter request object keys that are keys of login attributes
							var filtered_keys = _.filter(_.keys(parameters), function(key) {
								return _.contains(login_update_keys, key);
							});
							
							// Pick request object values from filtered keys
							loginUpdateItem = _.pick(parameters, filtered_keys);
						
							// Customize loginUpdateItem for dynamodb update
							for (key in loginUpdateItem) {
								value = loginUpdateItem[key];
								if (!_.isUndefined(value) && value) {
									//If Name or Company Name are updated, update session.
									// When email is updated, set isVerified to false
									
									switch(key)
									{
									case "Email_Address":
										if (value !== req.session.Email_Address) {
											check(loginUpdateItem[key]).isEmail();
											
											if (common.emailRegistrationEnabled()){
												loginUpdateItem['isEmailVerified'] = 0;
												loginUpdateItem['verifyToken'] = common.getToken();												
											} else {
												loginUpdateItem['isEmailVerified'] = 1;
												loginUpdateItem['verifyToken'] = "";												
											}
											emailUpdated = true;
										}
										break;
									case "Password":
										if (false === /^[\*]+$/.test(value)) {
											loginUpdateItem[key] = common.getPasswordHash(value);
											passwordUpdated = true;
										}
										break;
									default:
										loginUpdateItem[key] = parseInt(value);
									}
								}
							}
							
							console.log('\Updating Login Data for Contact: ' + contact + " " + JSON.stringify(loginUpdateItem));
							Login.update({Contact_Id: contact}, loginUpdateItem, {}, function(err, result) {
								if (err) {
									res.jsonp(500, {status: "Update error!"});
								} else {
									// Update Success
									
									if(emailUpdated || passwordUpdated) {
										// Since Email and/or Password were updated, delete the session
										var emailFromSession = req.session.Email_Address;
										
										common.deleteSession(req, function(){
											console.log("Update successful");
										
											if(emailUpdated){
												if (common.emailRegistrationEnabled()){
													// Send Verification Mail
													var toEmail = loginUpdateItem["Email_Address"];
													var subject = "Node CRM - Verification ";	    
													var body = "A request was sent to update email address used by Node CRM account. Please use the link below to verify the request.<br/><br/>" +
													    		"<a href='" + CLIENTURL + CLIENTPORT + "/verify?token=" + loginUpdateItem["verifyToken"] +"' target='_blank'>" + CLIENTURL + CLIENTPORT + "/verify?token=" + loginUpdateItem["verifyToken"] + "</a><br/><br/>" +
													    		"or visit <a href='" + CLIENTURL + CLIENTPORT + "/verify' target='_blank'>" + CLIENTURL + CLIENTPORT + "/verify</a> and copy/paste following verification code<br/><br/>" + loginUpdateItem["verifyToken"] + "<br/><br/>" +
													    		"If you did not send this request or this mail was sent to you by mistake, please ignore the mail or safely delete it from the inbox." +
													    		"<br/><br/>- Node CRM Team";
													common.sendEmail(toEmail, subject, body, function(error, response){
													    if(error) {
													    	// Problem sending mail but account was updated
															console.log("Mail Error: " + error);
															res.jsonp({status: "ok"});
													    } else {
															console.log("Message sent: " + response.message);
															res.jsonp({status: "ok"});
													    }
													});
												} else {
													res.jsonp({status: "ok"});
												}
											} else {
												res.jsonp({status: "ok"});
											}
										});
										
									} else {
										res.jsonp({status: "ok"});
									}
									
								}
							});
						} else {
							res.jsonp(500, errorMsg);
						}
					});
			} else 
				res.jsonp(500, errorMsg);
		}
	});
};

/*
 * Send Invitation (Manager only feature)
 */
exports.invite = function(req, res) {
	req.onValidationError(function(msg) {
		// Redirect the user with error 'msg'
	});

	//console.log("Session: " + JSON.stringify(req.session));
	var errorMsg = {status : 'Error!'};
	
	var contact = req.session.Contact_Id;
	var name = req.session.Name;
	var company = req.session.Company_Name;
	var isManager = req.session.isManager;
	var isCompanyManager = req.session.isCompanyManager;
	var email = req.params.email;
	
	// TODO - Validate email adderss;
	
	var errorMsg = {status : 'Could not send invitation. Access denied.'};
	
	if((1 == parseInt(isManager)) || (1 == parseInt(isCompanyManager))){
		
		var options = {"Company_Name": company};
		
		console.log('\nGET ID that the contact belongs to: ' + contact );
		Company.find(options, function(err, result) {
			if (err) {
				console.log(err);
				res.jsonp(500, errorMsg);
			} else {
				if(result != null && (1 == result.length) && result[0].Id){
					console.log("Company ID Fetch Success.");
					var company_code = result[0].Id;
					
					// Add Token To Invitation Table before Sending Mail
					
					var invitationItem = {}; 
					var invitationToken = common.getToken().substr(1,10);
					
					var invitationItem = {};
					invitationItem.Token_Id = invitationToken;
					invitationItem.Timestamp = common.getResetTimestamp();
					invitationItem.Company_Code = company_code;
					
					console.log("Token " + (typeof invitationToken) + " Timestamp " + (typeof common.getResetTimestamp().toString()) + " Code " + (typeof company_code));
					console.log("Invitation Item " + (typeof invitationItem));
					
					console.log('\nInserting Invitation Token/Timestamp for ' + company_code + ": " + JSON.stringify(invitationItem));
					i = new Invitation(invitationItem);
					i.save(function(err, result) {
						if (err) {
							// Failed!
							console.log(err);
							res.jsonp(500, {status: "Unknown error occurred!"});
						} else {
							console.log("Inserted Invitation Token Record.");
							
							// Send invitation
							var toEmail = email;
							var subject = "Node CRM - Invitation From " + name;	    
							var body = "This invitation has been sent to you by " + name + " of " + company + " to join Node CRM.<br/><br/>" +
							    		"Please take a moment to visit " + CLIENTURL + CLIENTPORT + "/register/" + company_code + "?token=" + invitationToken + " to create an account and join your colleagues at " + company + "." +
							    		"<br/><br/>- Node CRM Team";
							common.sendEmail(toEmail, subject, body, function(error, response){
							    if(error) {
									console.log("Mail Error: " + error);
									res.jsonp(500, errorMsg);
							    } else {
									console.log("Message sent: " + response.message);
									res.jsonp({"status":"ok"});
							    }
							});
						}
					});
					

				} else {
					console.log("Company ID Fetch Failed!");
					res.jsonp(500, errorMsg);
				}
			}
		});
	} else 
		res.jsonp(500, errorMsg);
};

/****************** Email Verification ******************/
function localTokenVerification(req, callback){
	req.onValidationError(function(msg) {
		// Redirect the user with error 'msg'
	});
	
	if(req.session.Contact_Id) {
			callback(500, {status: "Already Logged In! Please log out and try again."});
	} else {
		var errorMsg = {status : 'Verification failed.'};
		
		// Note: req.query.key is the token query parameter
		if((!_.isUndefined(req.query.token)) && req.query.token) {
			var options = { "verifyToken":req.query.token };								
			console.log('\nGET Verification Token ' + req.query.token);
			Login.find(options,function(err, result){
				if(err) {
					console.log("Token not found.");
					callback(500, {status: "Error!"});
				} else {
					console.log(result);
					if(result && (result.length === 1)) {
						console.log("Record Found: " + JSON.stringify(result));
						
						var contact = result[0]["Contact_Id"];
						if(!parseInt(result[0]["isEmailVerified"])){
							// Verify Email && Delete Token
							
							// Verify Email
							var verifyEmail ={};
							verifyEmail["isEmailVerified"] = 1;
							
							// Delete Token
							verifyEmail["verifyToken"] = "";
							
							console.log('\nSet Email Verified: ' + contact);
							Login.update({Contact_Id: contact}, verifyEmail, {}, function(err, result) {
								if (err) {
									// Failed!
									console.log(err);
									callback(500, errorMsg);
								} else {
									console.log("Verification successful");
									callback(200, {status: "ok"});
								}
							});
						} else {
							console.log("Already Verified!");
							// TODO - Delete Token
							callback(500, {status: "Account already verified."});
						}
					} else {
						console.log("Multiple tokens found!");
						callback(500, {status: "Token error"});
					}
				}
			});
		} else
			callback(500, {status: "Undefined parameters"});
	}
}

exports.tokenVerification = localTokenVerification;

exports.verifyAccount = function(req, res) {
	localTokenVerification(req, function(statusCode, result){
		res.jsonp(statusCode, result);
	});
};
/************ End of Email Verification ****************/

/****************** Password Recovery ******************/
function localAccountReset(req, callback){
	req.onValidationError(function(msg) {
		// Redirect the user with error 'msg'
	});
	
	if(req.session.Contact_Id) {
			callback(500, {status: "Already Logged In! Please log out and try again."});
	} else {
		var errorMsg = {status : 'Recovery failed.'};
		
		if ((!_.isUndefined(req.query.email)) && req.query.email) {
			// Check if email exists on the table
			// If it does, find Contact and insert token/timestamp and send email
			var options = { "Email_Address": req.query.email};								
			console.log('\nGET Email for Password Recovery ' + req.query.email);
			Login.find(options,function(err, result){
				if(err) {
					console.log("Email not found on the database!");
					callback(500, {status: "Unknown error occurred!"});
				} else {
					console.log(JSON.stringify(result));
					if((result != null) && (result.length === 1)) {
						console.log("Record Found: " + JSON.stringify(result));
						var contact = result[0]["Contact_Id"];
						
						var resetPassword = {};
						var resetToken = common.getToken();
						
						resetPassword["resetToken"] = resetToken;
						resetPassword["resetTimestamp"] = common.getResetTimestamp();
						
						console.log('\nInserting Password Reset Token/Timestamp for ' + contact + ": " + JSON.stringify(resetPassword));
						Login.update({Contact_Id: contact}, resetPassword, {}, function(err, data) {
							if (err) {
								// Failed!
								console.log(err);
								callback(500, {status: "Unknown error occurred!"});
							} else {
								console.log("Inserted Password Reset Record.");
								
								// Send email with reset link								
								var toEmail = result[0]["Email_Address"];
								var subject = "Node CRM - Password Reset Request";	    
								var body = "A request was sent to recover the password. Please click on the link below to reset your Node CRM account login credential.<br/><br/>" +
								    		"<a href='" + CLIENTURL + CLIENTPORT + "/recover?token=" + resetToken +"' target='_blank'>" + CLIENTURL + CLIENTPORT + "/recover?token=" + resetToken + "</a><br/><br/>" +
								    		"If you did not send this request, you may ignore this and the link will eventually expire." +
								    		"<br/><br/>- Node CRM Team";
								common.sendEmail(toEmail, subject, body, function(error, response){
								    if(error) {
								    	// Problem sending mail but token was inserted
										console.log("Mail Error: " + error);
										callback(500, {status: "Unknown error occurred!"});
								    } else {
										console.log("Message sent: " + response.message);
										callback(200, {status: "ok"});
								    }
								});
								
							}
						});
					} else {
						callback(500, {status: "Unknown error occurred!"});
					}
				}
			});
			
		}  else {
			callback(500, {status: "Insufficient Parameters!"});
		}
		
	}
}

exports.accountReset = localAccountReset;

exports.recoverAccount = function(req, res) {
	localAccountReset(req, function(statusCode, result){
		res.jsonp(statusCode, result);
	});
};
/*************** End of Password Recovery **************/

function removeProfile(account, done){
	console.log('\nRemove Account: ' + JSON.stringify(account));
	Company.remove({Id: account.Id, Company_Name: account.Company_Name}, function(err, result){
		if(err) {
			done();
		} else {
			done();
		}
	});
}

exports.removeAccount = function(req, res){
	var errorMsg = {status : "error", msg: "Remove error."};
	if(req.query.action && (req.query.action === 'account')){
		var options = {};
		Company.find(options, function(err, data) {
			if (err) {
				console.log(err);
				res.jsonp(500, errorMsg);
			} else {
				//console.log(JSON.stringify(data));
				if ( (data != null) && data.length) {
					async.forEachSeries(data, removeProfile, function(err){
						res.jsonp({status: "ok"});
					});
				} else {
					res.jsonp(500, errorMsg);
				}
					
			}
		});
	} else {
		res.jsonp({status: "ok", msg: ""});
	}
};
