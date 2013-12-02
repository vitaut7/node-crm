/**
 * Module dependencies.
 */

var express = require('express')
, http = require('http')
, Validator = require('validator').Validator
, Filter = require('validator')
, path = require('path')
, nodemailer = require('nodemailer')
, redis = require('redis')
, RedisStore = require('connect-redis')(express);

GLOBAL.fs = require('fs');
GLOBAL._ = require('underscore')._;
GLOBAL.check = require('validator').check;
GLOBAL.sanitize = require('validator').sanitize;
GLOBAL.uuid = require('node-uuid');
GLOBAL.async = require('async');
GLOBAL.config = require('./config');
GLOBAL.common = require('./routes/common');
GLOBAL.auth = require('./auth');

// Set up Redis
GLOBAL.client = redis.createClient();
client.on("error", function (err) {
    console.log("Redis error event - " + client.host + ":" + client.port + " - " + err);
});

GLOBAL.LANDING_PAGE = "dashboard";

// Handle Global Exceptions
process.on('uncaughtException', function (error) {
	   console.log(error.stack);
});

// Initialize express
var app = express();

GLOBAL.MODE = "DEVELOPMENT";
GLOBAL.CLIENTURL = "http://127.0.0.1";
GLOBAL.CLIENTPORT = ":8888";

app.configure('development', function() {
	app.use(express.errorHandler());
	
	GLOBAL.MODE = "DEVELOPMENT";
	GLOBAL.CLIENTPORT = ":8888";
});

//Middleware: Allows cross-domain requests (CORS)
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
};

app.configure(function() {
	app.set('port', process.env.PORT || 8880);
	
	if(MODE === "DEVELOPMENT") app.set('port', process.env.PORT || 8888);
	console.log("Mode: " + MODE);
	
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser());
	
	// Enable this for Production
	app.use(express.session({ store: new RedisStore, secret: 'BCHDyc6385^%fhJDn$kuf*M56SY', maxAge: 365 * 24 * 60 * 60 * 1000 }));
	
	// Enable this for Development
	//app.use(express.session({secret: 'BCHDyc6385^%fhJDn$kuf*m56Sy', maxAge: 365 * 24 * 60 * 60 * 1000 }));
	
	app.use(allowCrossDomain);
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));
});

// Start Routes Setup

// Remove www. from url
app.get('/*', function(req, res, next) {
	if(_.isUndefined(req.headers.host)) { next(); }
	
	if (req.headers.host.match(/^www/) !== null) {
		res.redirect('http://' + req.headers.host.replace(/^www\./, '') + req.url);
		return;
	} else {
		next();
	}
});

/*** Page Routes ****/

// Handle index page
app.get('/', function(req, res){
	if (req.session.Contact_Id) {
		res.redirect('/' + LANDING_PAGE);
	} else {
		res.sendfile('public/index.html');
	}
});

app.get('/dashboard', auth.checkPageAuth,  function(req, res){
	//res.sendfile('views/dashboard.ejs');
	res.render('dashboard.ejs', {
		layout:false,
		locals: { Name: req.session.Name }
	});
});
app.get('/contact', auth.checkPageAuth,  function(req, res){
	res.render('contact.ejs', {
		layout:false,
		locals: { Name: req.session.Name }
	});
});
app.get('/team', auth.checkPageAuth,  function(req, res){
	res.render('team.ejs', {
		layout:false,
		locals: { Name: req.session.Name }
	});
});
app.get('/lead', auth.checkPageAuth,  function(req, res){
	res.render('lead.ejs', {
		layout:false,
		locals: { Name: req.session.Name }
	});
});
app.get('/account', auth.checkPageAuth,  function(req, res){
	res.render('account.ejs', {
		layout:false,
		locals: { Name: req.session.Name }
	});
	
});
app.get('/product', auth.checkPageAuth,  function(req, res){
	res.render('product.ejs', {
		layout:false,
		locals: { Name: req.session.Name }
	});
});
app.get('/order', auth.checkPageAuth,  function(req, res){
	res.render('order.ejs', {
		layout:false,
		locals: { Name: req.session.Name }
	});
});
app.get('/report', auth.checkPageAuth,  function(req, res){
	res.render('report.ejs', {
		layout:false,
		locals: { Name: req.session.Name }
	});
});
app.get('/profile', auth.checkPageAuth,  function(req, res){
	res.render('profile.ejs', {
		layout:false,
		locals: { Name: req.session.Name }
	});
});
app.get('/invite', auth.checkPageAuth,  function(req, res){
	res.render('invite.ejs', {
		layout:false,
		locals: { Name: req.session.Name }
	});
});
app.get('/verify', auth.verify);
app.get('/recover', auth.recover);
app.get('/register/:company_code([a-z0-9-]{6})',  auth.registerWithCompanyCode);
app.get('/register',  auth.register);
app.post('/login', auth.loginPost);
app.get('/login',  auth.loginGet);
app.get('/logout', auth.logout);
/*** End of Page Routes ****/

/*
 * Bind node-validator to express req object
 */

var validator = new Validator();

http.IncomingMessage.prototype.mixinParams = function() {
	this.params = this.params || {};
	this.query = this.query || {};
	this.body = this.body || {};
	//Merge params from the query string
	for ( var i in this.query) {
		if (typeof this.params[i] === 'undefined') {
			this.params[i] = this.query[i];
		}
	}

	//Merge params from the request body
	for ( var i in this.body) {
		if (typeof this.params[i] === 'undefined') {
			this.params[i] = this.body[i];
		}
	}
};

http.IncomingMessage.prototype.check = function(param, fail_msg) {
	return validator.check(this.params[param], fail_msg);
};

http.IncomingMessage.prototype.checkHeader = function(param, fail_msg) {
	var to_check;
	if (header === 'referrer' || header === 'referer') {
		to_check = this.headers['referer'];
	} else {
		to_check = this.headers[header];
	}
	return validator.check(to_check || '', fail_msg);
};
http.IncomingMessage.prototype.onValidationError = function(errback) {
	validator.error = errback;
};
http.IncomingMessage.prototype.filter = function(param) {
	var self = this;
	var filter = new Filter();
	filter.modify = function(str) {
		this.str = str;
		self.params[param] = str; //Replace the param with the filtered version
	};
	return filter.sanitize(this.params[param]);
};
//Create some aliases - might help with code readability
http.IncomingMessage.prototype.sanitize = http.IncomingMessage.prototype.filter;
http.IncomingMessage.prototype.assert = http.IncomingMessage.prototype.check;

// *** Setup Mongoose ***
GLOBAL.mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1/nodecrmdb');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
	//Include global schema and model definitions
	eval(fs.readFileSync('globals.js')+'');

	contact = require('./routes/contact')
	, lead = require('./routes/lead')
	, leadHistory = require('./routes/leadHistory')
	, order = require('./routes/order')
	, orderHistory = require('./routes/orderHistory')
	, product = require('./routes/product')
	, task = require('./routes/task')
	, calendar = require('./routes/calendar')
	, crm = require('./routes/crm');
	
	// Include API Routes
	eval(fs.readFileSync('routes.js')+'');

	// Start HTTP + Express server
	http.createServer(app).listen(app.get('port'), function() {
		console.log("Express server listening on port " + app.get('port'));
	});
	
});
// End of Mongoose Setup

