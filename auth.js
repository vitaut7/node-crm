var nodemailer = require('nodemailer');

function isMobile(req){

	/*
	 * If ?mobile=1 is passed to the URL parameter, req.session.mobile will be 1.
	 * This is used to determine whether to send JSON or not to the client during login and logout. 
	 */
	
	if((!_.isUndefined(req.session.mobile)) && parseInt(req.session.mobile)) {
		return true;
	} else {
		if((!_.isUndefined(req.query.mobile)) && parseInt(req.query.mobile))
			return true;
		else
			return false;
	}
	
}

/*
 * When ?AuthToken=.... is passed to the URL parameter, the token is used to authenticate the client
 * without having to login through POST. This is being used to authenticate API calls.
 */
function getIdFromAuthToken(AuthToken, callback) {
	var options = { "token": AuthToken };								
	console.log('\nGET Contact record from token ' + AuthToken);
	Login.find(options,function(err, result){
		if(err) {
			callback("");
		} else {
			console.log(result);
			if((result != null) && (1 == result.length)) {
				// If duplicate records found, it's an error
				console.log("Items: " + result[0]["Contact_Id"]);
				if(1 == result.length) {
					if((!_.isUndefined(result[0]["Contact_Id"])) && result[0]["Contact_Id"] ){
						
						// Check if AuthToken is valid
						if(result[0]["tokenExpiry"] && ((new Date).getTime() <= parseInt(result[0]["tokenExpiry"]))) {
							console.log("Valid AuthToken");
							callback(result[0]);
						} else {
							console.log("Expired AuthToken");
							callback("");
						}
					} else {
						console.log("Contact ID error!"); callback(""); 
					}
				} else { console.log("Length error!"); callback(""); }
			} else {
				console.log("Duplicate or No Records Found");
				callback("");
			}
		}
	});
}

/*
 * Determine if logged in user is Company Manager. Company Manager can 
 * add products and invite team members.
 */
function isCompanyManager(contact_id,company_code, callback){
	var data = {};
	
	console.log('\nCheck if contac is Company Manager: ' + contact_id );
	Company.find({Id: company_code}, function(err, result) {
		if (err) {
			console.log(err);
			callback(data);
		} else {
			console.log(JSON.stringify(result));
			if((!_.isUndefined(result)) && (1 == result.length)){
				if(result[0].Manager_Id === contact_id) {
					console.log(contact_id + " is a manager.");
					data.isCompanyManager = 1;
				} else
					data.isCompanyManager = 0;
				
				data.Company_Name = result[0].Company_Name || "";
				
				callback(data);
			} else
				callback(data);
		}
	});
}

// Authenticate through Username/Password or AuthToken passed through URL parameter
function checkAPIAuth(req, res, next) {
	if (req.cookies.c){
		// Set Contact_Id from cookie
		req.session.Contact_Id = req.cookies.c;
	}
	
	if(req.session.Contact_Id) {
		next();
	} else if ((!_.isUndefined(req.query.AuthToken)) && req.query.AuthToken){
		// If authenticated through Token, set session variables and proceed to the request
		getIdFromAuthToken(req.query.AuthToken, function(loginDetails){
			if(!_.isUndefined(loginDetails) && loginDetails.Contact_Id){
				req.session.Contact_Id = loginDetails.Contact_Id;
				// Set other session variables as well
				req.session.Company_Code = loginDetails.Company_Code || "";
				req.session.Email_Address = loginDetails.Email_Address || "";
				req.session.isManager = loginDetails.isManager || 0;
				
				isCompanyManager(req.session.Contact_Id,req.session.Company_Code, function(checkResult){
					if(checkResult.isCompanyManager) {
						console.log("Setting Session for Company Manager");
						req.session.isCompanyManager = 1;
					} else {
						console.log("Setting Session for NOT Company Manager");
						req.session.isCompanyManager = 0;
					}
					req.session.Company_Name = checkResult.Company_Name || "";
					
					// Retrieve Contact Details
					console.log('\nGet Contact Record: ' + loginDetails.Contact_Id);
					Contact.findOne({_id: loginDetails.Contact_Id},function(err, data){
						if(err) {
							console.log(err);
							common.deleteSession(function(){
								res.jsonp({status: "error", msg: 'Unknown error.'});
							});
						} else {
							console.log(JSON.stringify(data));
							if((!_.isUndefined(data)) && (!_.isNull(data)) && (!_.isEmpty(data))) {
								req.session.Name = data.Name || "";
								
								next();
							} else {
								common.deleteSession(function(){
									res.jsonp({status: "error", msg: 'Unknown error.'});
								});
							}	
						}
					});
				});
			} else
				res.jsonp({status: "error", msg: 'Unauthorized access.'});
		});
	} else {
		res.jsonp({status: "error", msg: 'Unauthorized access.'});
	}
}
exports.checkAPIAuth = checkAPIAuth;

// Verify user is logged in before accessing the page
function checkPageAuth(req, res, next) {
	if(req.session.Contact_Id) {
		next();
	} else {
		res.redirect("/login");
	}
}
exports.checkPageAuth = checkPageAuth;

/*
 * Set session variables as part of login completion process
 */
function setSessionVariables(req, result, done){
	// Set other session variables
	if(!_.isUndefined(req.query.mobile) && parseInt(req.query.mobile))
		req.session.mobile = 1;
	
	if(!_.isUndefined(result[0]["isManager"]))
		req.session.isManager = parseInt(result[0]["isManager"]);
	
	// Retrieve details from Contact Table
	Contact.findOne({_id: req.session.Contact_Id}, function(err, data){
		if(err) {
			console.log(err);
			done(false);
		} else {
			console.log(data);
			if(data != null)
				req.session.Name = data.Name || "Unknown";
			else
				res.session.Name = "Unknown";
			
			// Retrieve Company Code
			console.log('\nGET Company Information about contact: ' + req.session.Contact_Id );
			Company.find({Id: result[0]["Company_Code"]}, function(err, companyResult) {
				if (err) {
					console.log(err);
					done(true);
				} else {
					console.log(JSON.stringify(companyResult));
					if(companyResult != null && (1 == companyResult.length) && !_.isUndefined(companyResult[0]) && companyResult[0].Company_Name){
						console.log("Company ID Fetch Success.");
						req.session.Company_Code = companyResult[0].Id;
						req.session.Company_Name  = companyResult[0].Company_Name;
						
						console.log("Company Result: " + JSON.stringify(companyResult));
						console.log("Session: " + JSON.stringify(req.session));
						
						if(companyResult[0].Manager_Id && (req.session.Contact_Id === companyResult[0].Manager_Id))
							req.session.isCompanyManager = 1;
						else
							req.session.isCompanyManager = 0;
						
						done(true);
					} else {
						console.log("Company ID Fetch Failed!");
						done(true);
					}
				}
			});
		}
	});
}

// Update Token update every time user logs in. Token is used for API authentication.
function updateAuthenticationToken(req, result, done){
	// Check if Email is Verified and User is not banned
	if (!_.isUndefined(result[0]["isEmailVerified"])
			&& (parseInt(result[0]["isEmailVerified"]) === 1)
			&& !_.isUndefined(result[0]["isBanned"])
			&& (parseInt(result[0]["isBanned"]) === 0)) {
		
		req.session.Contact_Id = result[0]["Contact_Id"];
		req.session.isManager = 0;
		req.session.Email_Address = result[0]["Email_Address"];
		req.session.isCompanyManager = 0;
		
		// Set Auth Token and Expiry
		
		// If Token has expired, generate a new one
		if(result[0]["token"] && result[0]["tokenExpiry"] && (parseInt(result[0]["tokenExpiry"]) > (new Date).getTime())){
			// Token is active, return Current Token

			req.session.token = result[0]["token"];
			req.session.tokenExpiry = result[0]["tokenExpiry"];
			
			// Set remaining session variables and return
			setSessionVariables(req, result, done);
			
		} else {
			// Save new token and expiry on the database;
			var token = common.generateAuthToken();
			var tokenExpiry = common.getResetTimestamp(1); // Set Expiry to 1 day;
			
			var tokenUpdateItem = {};
			tokenUpdateItem["token"] = token;
			tokenUpdateItem["tokenExpiry"] = tokenExpiry;
			
			console.log('\nUpdating new Token for: ' + req.session.Contact_Id);
			Login.update({Contact_Id: req.session.Contact_Id}, tokenUpdateItem, {}, function(err, tokenResult) {
				if (err) {
					// Failed!
					common.deleteSession(req, function(){
						done(false);
					});
				} else {
					// Set session token
					req.session.token = token;
					req.session.tokenExpiry = tokenExpiry;
					
					// Set remaining session variables and return;
					setSessionVariables(req, result, done);
				}
			});
		}
	} else done(false);
}


// Verify username and password are correct
function processLogin(req, callback){
	params = req.body;
	if ((!_.isUndefined(req.query)) && (!_.isNull(req.query)) && (!_.isEmpty(req.query))){
		params = req.query;
	}
	
	console.log("Checking Remember: " + params.remember);
	
	if ((!_.isUndefined(params.user)) && params.user && (!_.isUndefined(params.password)) && params.password){
		// Attempt a Log in with Password
		var options = {"Username": params.user};
		console.log('\nChecking User Login for U: ' + params.user + " and P: " + params.password);
		Login.find(options,function(err, result){
			if(err) {
				console.log(err);
				callback(false);
			} else {
				console.log("Password Login Result: " + JSON.stringify(result));
				if( result != null && (result.length === 1) && !_.isUndefined(result[0]) && result[0]["Password"] && common.checkPassword(params.password, result[0]["Password"])) {
						// Success
					updateAuthenticationToken(req, result, function(data){
						console.log("Successful Login with Username");						
						callback(data);
					});
				} else {
					// Attempt a Log in with Email Address
					var options = {"Email_Address": params.user};
					console.log('\nChecking Email Login for U: ' + params.user + " and P: " + params.password);
					Login.find(options, function(err, result){
						if(err) {
							console.log(err);
							callback(false);
						} else {
							console.log("Email Login Result: " + JSON.stringify(result));
							if( result != null && (result.length === 1) && !_.isUndefined(result[0]) && result[0]["Password"] && common.checkPassword(params.password, result[0]["Password"])) {
									// Success
								updateAuthenticationToken(req, result, function(data){
									console.log("Successful Login with Email");
									callback(data);
								});
							} else {
								callback(false);
							}
						}
					});
				}
			}
		});
	} else {
		console.log("Undefined Parameters " + JSON.stringify(params));
		callback(false);
	}
}

exports.verify = function(req, res){
	if((!_.isUndefined(req.query.token)) && req.query.token) {
		crm.tokenVerification(req, function(statusCode, result){
			var msg = "<div class='alert alert-block alert-error fade in'>" +
			"<button type='button' class='close' data-dismiss='alert'>&times;</button>" +
			"There was an error. <a href='/verify'>Try again</a>" +
		    "</div>";
			
			if(statusCode === 200) {
				msg = "<div class='alert alert-block alert-success fade in'>" +
				"<button type='button' class='close' data-dismiss='alert'>&times;</button>" +
				"Thank you. You may now proceed to <a href='login'>Log In</a>" +
			    "</div>";
			}
			
			res.render('verify.ejs', {
				layout:false,
				locals: { msg: msg, display: "none" }
			});
			
		});
	} else {
		res.render('verify.ejs', {
			layout:false,
			locals: { msg: "", display: "inline"}
		});
	}
};

exports.recover = function(req, res){
	if((!_.isUndefined(req.query.token)) && req.query.token) {
		var options = { "resetToken": req.query.token };								
		console.log('\nGET Password Reset Token ' + req.query.token);
		Login.find(options,function(err, result){
			if(err) {
				console.log("Token Error:" + err);
				res.render('recover.ejs', {
					layout:false,
					locals: { token: "", msg: "Token not found.", displayEmail: "inline"}
				});
			} else {
				console.log(JSON.stringify(result));
				if((!_.isUndefined(result)) && (!_.isUndefined(result)) && (result.length === 1)) {
					console.log("Record Found: " + JSON.stringify(result));
					
					var contact = result[0]["Contact_Id"];
					var timestamp = result[0]["resetTimestamp"];
					//var email = result[0]["Email_Address"];
					
					// If Reset Timestamp is expired, delete the token and timestamp
					if(timestamp < (new Date().getTime())) {
						// Invalid, delete the token & timestamp
						var resetPassword = {};
						resetPassword["resetToken"] = "";
						resetPassword["resetTimestamp"] = "";
						
						console.log('\nDeleting Expired Token/Timestamp and Updating Password for: ' + contact);
						Login.updat({Contact_Id: contact}, resetPassword, {}, function(err, result) {
							if (err) {
								// Failed!
								console.log(err);
								res.render('recover.ejs', {
									layout:false,
									locals: { token: "", msg: "Unknown Error.", displayEmail: "inline"}
								});
							} else {
								console.log("Token expired!");
								res.render('recover.ejs', {
									layout:false,
									locals: { token: "", msg: "Token expired!", displayEmail: "inline"}
								});
							}
						});
					} else {
						// Valid, Delete Token & Update Password
						var resetPassword = {};
						
						var generatePassword = common.generatePassword();
						resetPassword["Password"] = common.getPasswordHash(generatePassword);
						resetPassword["resetToken"] = "";
						resetPassword["resetTimestamp"] = "";  
							
						console.log('\nUpdating Password and deleting Token/Timestamp for: ' + contact);
						Login.update({Contact_Id: contact}, resetPassword, {}, function(err, data) {
							if (err) {
								// Failed!
								console.log(err);
								res.render('recover.ejs', {
									layout:false,
									locals: { token: "", msg: "Unknown Error.", displayEmail: "inline"}
								});
							} else {
								// Send mail with new password
								var toEmail = result[0]["Email_Address"];
								var subject = "Node CRM - Password Reset Request";	    
								var body = "Your password has been reset. The new password is:<br/><br/>" +
								    		generatePassword + "<br/><br/>" + 
								    		"Use the link <a href='" + CLIENTURL + CLIENTPORT + "/login' target='_blank'>" + CLIENTURL + CLIENTPORT + "/login</a> to Log In." +
								    		"<br/><br/>- Node CRM Team";
								common.sendEmail(toEmail, subject, body, function(error, response){
								    if(error) {
								    	// Problem sending mail but token was inserted
										console.log("Mail Error: " + error);
										res.render('recover.ejs', {
											layout:false,
											locals: { token: "", msg: "Mail Error!", displayEmail: "inline" }
										});
								    } else {
										console.log("Message sent: " + response.message);
										res.render('recover.ejs', {
											layout:false,
											locals: { token: req.query.token, msg: "<div class='alert alert-block alert-success fade in'>" +
														"<button type='button' class='close' data-dismiss='alert'>&times;</button>" +
														"Password has been emailed. You may now <a href='/login'>Login</a> to continue." +
													    "</div>", displayEmail: "none"}
										});
								    }
								});
								
								//console.log("Password updated!");
							}
						});
					}
				} else {
					console.log("Token not found or multiple tokens found!");
					res.render('recover.ejs', {
						layout:false,
						locals: { token: "", msg: "Token not found or multiple tokens found!", displayEmail: "inline"}
					});
				}
			}
		});
	} else {
		res.render('recover.ejs', {
			layout:false,
			locals: { token: "", msg: "", displayEmail: "inline"}
		});
	}
};

exports.registerWithCompanyCode = function(req, res){
	if(req.session.Contact_Id) {
		if(isMobile(req)) {
			res.jsonp(500, {status: "Already Logged In!"});
		} else {
			res.redirect("/" + LANDING_PAGE);
		}
	} else {
		// Log out before presenting the Registration Form
		common.deleteSession(req, function(){
			company_code = req.params.company_code;
			
			if(company_code === 'new'){
				req.session.registration_company_code = "";
				req.session.registration_company_name = "";				
				delete req.session.registration_company_code;
				delete req.session.registration_company_name;
				
				res.redirect("/register");
			} else {
				console.log('\nGet Company Name for Code: ' + company_code);
				Company.find({Id: company_code}, function(err,data) {
					if (err) {
						console.log("Error: "  + err);
						delete req.session.registration_company_code;
						delete req.session.registration_company_name;
						
						res.redirect("/register");
					} else {
						console.log(JSON.stringify(data));
						
						// Check Token Validity
						token = req.query.token || ""; // Token passed as URL query parameter
						
						var errorMsg = {status: "Invalid Token!"};
						
						if(token) {
							console.log('\nGet Token Record ' + token  + " for: " + company_code);
							Invitation.findOne({Token_Id: token, Company_Code: company_code}, function(err, tokenResult){
								if(err) {
									console.log(err);
									delete req.session.registration_company_code;
									delete req.session.registration_company_name;
									res.jsonp(500, errorMsg);
								} else {
									console.log(tokenResult);
									if(tokenResult !== null){
										console.log("Invitation Token Found: " + JSON.stringify(tokenResult));
										
										// Delete Token First
										console.log('\nDeleting Token: ' + token);
										Invitation.remove({Token_Id: token, Company_Code: company_code}, function(err, deleteResult) {
											// Check Invitation Token Validity
											if((tokenResult.Timestamp) && (parseInt(tokenResult.Timestamp) > (new Date()).getTime())){
												// Valid Token
												
												// Ensure Company Name is not empty from above result
												if( (!_.isUndefined(data)) && (!_.isUndefined(data)) && (1 == data.length) && data[0].Company_Name){
													req.session.registration_company_code = company_code;
													req.session.registration_company_name = data[0].Company_Name;
													res.redirect("/register");
												} else {
													delete req.session.registration_company_code;
													delete req.session.registration_company_name;
													res.jsonp(500, errorMsg);
												}
											} else {
												console.log("Expired Token!");
												delete req.session.registration_company_code;
												delete req.session.registration_company_name;
												res.jsonp(500, errorMsg);
											}
										});
									} else {
										delete req.session.registration_company_code;
										delete req.session.registration_company_name;
										res.jsonp(500, errorMsg);
									}
								}
							});
						} else {
							delete req.session.registration_company_code;
							delete req.session.registration_company_name;
							res.jsonp(500, errorMsg);
						}
						
					}
					
				});
			}
		});
	}
};

exports.register = function(req, res){
	if(req.session.Contact_Id) {
		if(isMobile(req))
			res.jsonp(500, {status: "Already Logged In!"});
		else {
			res.redirect("/" + LANDING_PAGE);
		}
	} else {
		
		// Display password field if email registration is disabled
		var passwordFieldBlock = "";
		if (!common.emailRegistrationEnabled()){
			passwordFieldBlock = '<div class="control-group">'
				+ '<label class="control-label" for="input01">Password</label>'
				+ '<div class="controls">'
				+ '	 <input id="password" placeholder="Password" class="input-xlarge" required type="password" data-bind="value: $data.Password">'
				+ '</div>'
				+ '</div>';
		}
		
		if((!_.isUndefined(req.session.registration_company_code)) && req.session.registration_company_code){
			res.render('register.ejs', {
				layout:false,
				locals: { 
						  Company_Name: "<label class='alert alert-info' style='width: 242px'>" + req.session.registration_company_name + "</label>" +
										"<small><span class='alert alert-warning'>Not part of " + req.session.registration_company_name + 
										"? <a class='btn btn-success btn-small' href='/register/new/'>Register New</a></span></small>",
						  Password_Field_Block: passwordFieldBlock
						}
			});
		} else{
			res.render('register.ejs', {
				layout:false,
				locals: { 
							Company_Name: "<input required autofocus placeholder='Company Name' class='input-xlarge' type='text' data-bind='value: $data.Company_Name'>",
							Password_Field_Block: passwordFieldBlock
					    }
			});
		}
	}
};

exports.loginPost = function(req, res) {
	delete req.session.registration_company_code;
	delete req.session.registration_company_name;
	
	console.log("Received POST login request: " + JSON.stringify(req.body));
	
	processLogin(req, function(result){
		console.log("Remember Me Setting: " + req.body.remember + " Will set to: " + req.session.Contact_Id);
		// Set cookie if requested
		if (req.body.remember && (parseInt(req.body.remember) == 1)){
			console.log("Setting cookie...");
			res.cookie("c", req.session.Contact_Id);
		}
		
		if(true === result){
			if(!isMobile(req)) {
				res.redirect("/" + LANDING_PAGE);
			} else {
				res.jsonp({status: "ok"});
			}
		} else{
			console.log("Failed POST login");
			if(!isMobile(req)) {
				//res.sendfile('views/login.ejs');
				res.render('login.ejs', {
					layout:false,
					locals: { }
				});
			} else {
				res.jsonp({status: "error"});
			}
		}
	});
};

exports.loginGet = function(req, res){
	if(req.session.Contact_Id) {
		if(!isMobile(req)) {
			res.redirect('/' + LANDING_PAGE);
		} else {
			res.jsonp({status: "ok"});
		}
	} else {
		console.log("Processing GET login method");
		
		console.log("Query Parameters: " + JSON.stringify(req.query));
		if ((!_.isUndefined(req.query.user)) && req.query.user && (!_.isUndefined(req.query.password)) && req.query.password){
			console.log("parameters passed");
		}
		
		if ((!_.isUndefined(req.query.user)) && req.query.user && (!_.isUndefined(req.query.password)) && req.query.password){
			processLogin(req, function(result){
				console.log("Remember Me Setting: " + req.query.remember + " Will set to: " + req.session.Contact_Id);
				// Set cookie if requested
				if (req.body.remember && (parseInt(req.body.remember) == 1)){
					console.log("Setting cookie...");
					res.cookie("c", req.session.Contact_Id);
				}
				
				if(true === result){
					if(!isMobile(req)) {
						res.redirect('/' + LANDING_PAGE);
					} else {
						res.jsonp({status: "ok"});
					}
				} else{
					if(!isMobile(req)) {
						res.redirect('/login');
					} else {
						res.jsonp({status: "error"});
					}
				}
			});
		} else {
			console.log("Undefined User or Password");
			if(!isMobile(req)) {
				//res.jsonp({status: "sending login page: " + JSON.stringify(isMobile(req)) });
				//res.sendfile('views/login.ejs');
				res.render('login.ejs', {
					layout:false,
					locals: { }
				});
			} else {
				res.jsonp({status: "login"});
			}
		}
	}
};

exports.loginAPI = function(req, res){
	if(req.session.Contact_Id) {
		res.jsonp({status: "Already logged in."});
	} else {
		console.log("Processing GET login method");
		
		console.log("Query Parameters: " + JSON.stringify(req.query));
		
		if ((!_.isUndefined(req.query.user)) && req.query.user && (!_.isUndefined(req.query.password)) && req.query.password){
			processLogin(req, function(result){
				if(true === result){
					console.log("Authenticated: " + req.session.token);
					res.jsonp({status: "ok", msg: "Login Success.", AuthToken: req.session.token});
				} else {
					res.jsonp({status: "error", msg: "Login failed."});
				}
			});
		} else {
			console.log("Undefined User or Password");
			res.jsonp({status: "error", msg: "Insufficient Parameters"});
		}
	}
};

exports.logout = function(req, res) {
	var mobile = isMobile(req);

	// Delete cookie
	res.clearCookie('c', { path: '/' });
	
	if(!mobile){ 
		common.deleteSession(req, function(){
			res.redirect('/');
		});
	} else {
		common.deleteSession(req, function(){
			res.jsonp({status: "ok"});
		});
	}
};

exports.logoutAPI = function(req, res) {
	// Delete cookie
	res.clearCookie('c', { path: '/' });

	common.deleteSession(req, function(){
		res.jsonp({status: "ok"});
	});
};