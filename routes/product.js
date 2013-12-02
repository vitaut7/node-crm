var product_keys = common.getFields(Product);
var filter_array = common.getStringFields(Product);

/*
 * GET Product Record
 */
exports.getProduct = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	product = req.params.product; 
	
	var errorMsg = { status : 'Not Found' };
	
	console.log('\nGet Product Record: ' + product);
	Product.findOne({Contact_Id: contact, _id: product}, function(err, result){
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
 * Add Product Record
 */
exports.addProduct = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});
	
	contact = req.session.Contact_Id; 
	
	/*
	 * Filter request object keys that are keys of product attributes and
	 * have defined values 
	 */
	var parameters = req.body;
	if ((!_.isUndefined(req.query)) && (!_.isNull(req.query)) && (!_.isEmpty(req.query))) {
		parameters = req.query;
	}	
	
	var filtered_keys = _.filter(_.keys(parameters), function(key){
		return _.contains(product_keys,key) && !_.isUndefined(parameters[key]) && parameters[key];
	});
	
	// Pick request object values from filtered keys
	insertItem = _.pick(parameters,filtered_keys);
	insertItem["Contact_Id"] = contact;
	insertItem["Product_Added"] = ((new Date()).getUTCFullYear()) + '-' + ('0' + ((new Date()).getUTCMonth() + 1)).substr(-2, 2) + '-' + ('0' + (new Date()).getUTCDate()).substr(-2, 2);
	
	// Sanitize
	_.each(filter_array, function(item){
		if( (!_.isUndefined(insertItem[item])) && insertItem[item]){
			insertItem[item] = filter(insertItem[item]);
		}
	});
	
	var errorMsg = { status : 'Insert failed.' };
	
	console.log('\nInserting Product Record: ' + JSON.stringify(insertItem));
	var p = new Product(insertItem);
	var product = p._id;
	p.save(function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			res.jsonp({status: "ok", id: product});
		}
	});
	
};

/*
 * Update Product Record
 */
exports.updateProduct = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	product = req.params.product; 
	
	var parameters = req.body;
	if ((!_.isUndefined(req.query)) && (!_.isNull(req.query)) && (!_.isEmpty(req.query))) {
		parameters = req.query;
	}	
	
	// Filter request object keys that are keys of product attributes 
	var filtered_keys = _.filter(_.keys(parameters), function(key){
		return _.contains(product_keys,key);
	});
	
	// Pick request object values from filtered keys
	updateItem = _.pick(parameters,filtered_keys);
	
	// Sanitize
	_.each(filter_array, function(item){
		if( (!_.isUndefined(updateItem[item])) && updateItem[item]){
			updateItem[item] = filter(updateItem[item]);
		}
	});
	
	var errorMsg = { status : 'Update failed' };
	
	console.log('\Updating Product Record: ' + JSON.stringify(updateItem));
	Product.update({Contact_Id: contact, _id: product}, updateItem,{},function(err, result){
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
 * Delete Product Record
 */
exports.deleteProduct = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	product = req.params.product; 
	
	var errorMsg = { status : 'Delete failed.' };
	
	console.log('\nDelete Product Record: ' + product + ", " + contact);	
	Product.remove({Contact_Id: contact, _id: product},function(err){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log("deleted");
			res.jsonp({status: "ok"});
		}
	});
};

/*
 * Get All Product Records
 */
exports.getAll = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	
	var errorMsg = { status : 'Not Found' };
	
	console.log('\nGET All Product Records for Contact');
	Product.find({Contact_Id: contact}, function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			if(result != null) {
					res.jsonp(result);
			} else 	res.jsonp("");
		}
	});
};

/*
 * Get All Product Records By Contact, Status
 * {Available, Discontinued}
 */
exports.getAllByStatus = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	status = req.params.status; 
	
	var errorMsg = { status : 'Not Found' };
	var options = { Contact_Id: contact, "Status": status};
	
	console.log('\nGET All Product Records for Contact By Status');
	Product.find(options,function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			if(result != null) {
					res.jsonp(result);
			} else 	res.jsonp("");
		}
	});
};

/*
 * Get All Product Records By Contact, Segment
 * {Available, Discontinued}
 */
exports.getAllSegments = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	
	var errorMsg = { status : 'Not Found' };
	var options = { Contact_Id: contact };
	
	console.log('\nGET All Segments Records for Contact');
	Product.find(options,function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			if(result != null) {
				segments = _.uniq(_.pluck(result,"Product_Segment"));
				mappedArray = _.map(segments, function(segment){ return {"Product_Segment": segment}; });
				res.jsonp(mappedArray);
			}  else res.jsonp("");
		}
	});
};

/*
 * Get All Categories Records By Contact, Segment
 */
exports.getAllCategories = function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	segment = req.params.segment;
	
	var errorMsg = { status : 'Not Found' };
	var options = { Contact_Id: contact, "Product_Segment": segment };
	
	console.log('\nGET All Category Records for Contact By Segment');
	Product.find(options,function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			if(result != null) {
					categories = _.uniq(_.pluck(result,"Product_Category"));
					mappedArray = _.map(categories, function(category){ return {"Product_Category": category}; });
					res.jsonp(mappedArray);
			} else 	res.jsonp("");
		}
	});
};

exports.getAllByCategory= function(req, res) {
	req.onValidationError(function(msg) {
		//Redirect the user with error 'msg'
	});

	contact = req.session.Contact_Id; 
	segment = req.params.segment;
	category = req.params.category;
	
	var errorMsg = { status : 'Not Found' };
	var options = { Contact_Id: contact, "Product_Segment": segment, "Product_Category": category };
	
	console.log('\nGET All Product Records for Contact By Segment and Category');
	Product.find(options,function(err, result){
		if(err) {
			console.log(err);
			res.jsonp(500, errorMsg);
		} else {
			console.log(result);
			if( result != null) {
					res.jsonp(result);
			} else 	res.jsonp("");
		}
	});	
};

function insertImportedProduct(line, done){
	console.log("Line: " + line);
	
	var p = line.split(',');
	_.map(p, function(item){
		item.trim();
	});
	
	var ProductItem = {};

	ProductItem.Contact_Id = p[0]; // First Field is Contact ID
	//ProductItem.Product_Id = p[1]; // Second Field is New Product ID
	
	if(p[2] && p[3] && p[4] && p[5]) { // if Name, Segment, Category and Descriptions are defined
		ProductItem.Product_Name = sanitize(p[2]).str;
		ProductItem.Product_Segment = sanitize(p[3]).str;
		ProductItem.Product_Category = sanitize(p[4]).str;
		ProductItem.Product_Description = sanitize(p[5]).str;		
		//ProductItem.Min_Order = ((!_.isUndefined(p[6]))&&(parseInt(p[6])))?parseInt(p[6]):1;
		//ProductItem.Max_Order = ((!_.isUndefined(p[7]))&&(parseInt(p[7])))?parseInt(p[7]):100;
		ProductItem.Product_Added = '' + ((new Date()).getUTCFullYear()) + '-' + ('0' + ((new Date()).getUTCMonth() + 1)).substr(-2, 2) + '-' + ('0' + (new Date()).getUTCDate()).substr(-2, 2);
		ProductItem.Product_Status = "Available";
		
		console.log('\nInserting Imported Product Record: ' + JSON.stringify(ProductItem));
		var pi = new Product(ProductItem);
		pi.save(function(err, result) {
			done();
		});
	} else done();

}

exports.importProduct = function(req,res){
	
	if((!_.isUndefined(req.files)) && (!_.isUndefined(req.files.importfile))) {
		console.log("Uploaded Item: " + JSON.stringify(req.files.importfile));
		var Products = fs.readFileSync(req.files.importfile.path).toString().trim().split(/\r\n|\r|\n/g);
		
		Products = _.map(Products, function(item){
			return req.session.Contact_Id + ",000," + item.trim();
		});
		
		console.log("Products: " + JSON.stringify(Products));
		
		async.forEachSeries(Products, insertImportedProduct, function(err){
			console.log("Products Inserted: " + JSON.stringify(Products));
			res.jsonp({status: "ok"});
		});
	} else res.jsonp(500,{status: "Undefined error!"});

};
