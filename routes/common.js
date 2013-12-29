var nodemailer = require('nodemailer');
var bcrypt = require('bcrypt');

/*********** Common Functions *****************/
exports.isValidPassword = function(password){
	if((!_.isUndefined(password)) && (password.length >= PASSWORD_LENGTH)) {
		return true;
	} else {
		return false;
	}
};

exports.emailRegistrationEnabled = function(){
	return ENABLE_EMAIL_REGISTRATION;
};

exports.getEmailUsername = function() {
	return EMAIL_USERNAME;
};

exports.getEmailPassword = function() {
	return EMAIL_PASSWORD;
};

exports.getResetTimestamp = function(days){
	if( (!_.isUndefined(days)) && parseInt(days) )
		return ((new Date()).getTime() + ((new Date()).getTimezoneOffset() * 60000)) + (days * 86400000);
	
	return ((new Date()).getTime() + ((new Date()).getTimezoneOffset() * 60000)) + (PASSWORD_RESET_EXPIRY * 86400000);
};

exports.getToken = function(){
	return require('crypto').createHash('sha512').update(Math.random() + getSalt()).digest('hex').substr(0,AUTH_TOKEN_LENGTH);
};

exports.deleteSession = function(req, callback){
	console.log("Delete session for: " + req.session.Contact_Id);
	delete req.session.Contact_Id;
	delete req.session.Name;
	delete req.session.Email_Address;
	delete req.session.Company_Code;
	delete req.session.Company_Name;
	delete req.session.isManager;
	delete req.session.isCompanyManager;
	delete req.session.mobile;
	delete req.session.token;
	delete req.session.tokenExpiry;
	callback();
};

exports.generatePassword = function(length){
	var password_length = length || PASSWORD_LENGTH;
	
    var text = "";
    var possible = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789-_";

    for( var i=0; i < password_length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};

function getSalt(){
	return bcrypt.genSaltSync(10);
}

exports.getPasswordHash = function(p){
	//return require('crypto').createHash('sha512').update(SALT + p).digest('hex');
	return bcrypt.hashSync(p, getSalt());
};

exports.checkPassword = function(p1, hash){
	return bcrypt.compareSync(p1, hash); 
};

exports.generateAuthToken = function() {
    var text = "";
    var possible = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789-_";

    for( var i=0; i < (AUTH_TOKEN_LENGTH - 1); i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return 'A' + text;
};

exports.filter = function (filterinput) {
	if(typeof filterinput === 'string') {
		filterinput = sanitize(filterinput).trim();
		filterinput = sanitize(filterinput).str;
		return filterinput;
	}else if(typeof filterinput === 'object'){
		for(key in filterinput){
			if(typeof filterinput[key] === 'string'){
				filterinput[key] = filter(filterinput[key]).trim();
				filterinput[key] = filter(filterinput[key]).str;
			}
		}
		return filterinput;
	}
};

exports.getFields = function(obj){
	fields = _.keys(obj.schema.paths);
	removeFields = ['_id', '__v'];
	return _.difference(fields,removeFields);
};

exports.getStringFields = function(obj){
	fields = _.keys(obj.schema.paths);
	removeFields = ['_id', '__v'];
	fields = _.difference(fields,removeFields);
	
	return _.filter(fields,function(f){ return obj.schema.paths[f].instance === 'String'; });
};

exports.getRequiredFields = function(obj){
	fields = _.keys(obj.schema.paths);
	removeFields = ['_id', '__v'];
	fields = _.difference(fields,removeFields);
	
	return _.filter(fields,function(f){ 
		if(schema.paths && schema.paths[f] && schema.paths[f].validators && schema.paths[f].validators[0]) 
			return schema.paths[f].validators[0][2] === 'required'; 
		else 
			return false; 
	});	
};

exports.sendEmail = function(toEmail, subject, body, callback){
	console.log('Sending Mail To: ' + toEmail);
	
	var smtpTransport = nodemailer.createTransport("SMTP",{
		service: "Gmail",
		auth: {
			user: common.getEmailUsername(),
			pass: common.getEmailPassword()
		}
	});
	
	var mailOptions = {
	    from: "Node CRM", // sender address
	    to: toEmail, // list of receivers
	    subject: subject, // Subject line	    
	    html: body	 // html body
	};
	
	smtpTransport.sendMail(mailOptions, function(error, response){
		callback(error, response);
	});
	
	smtpTransport.close();
};