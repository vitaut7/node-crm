GLOBAL.filter = function (filterinput) {
	if(typeof filterinput === 'string') {
		filterinput = sanitize(filterinput).trim();
		return filterinput;
	}else if(typeof filterinput === 'object'){
		for(key in filterinput){
			if(typeof filterinput[key] === 'string'){
				filterinput[key] = filter(filterinput[key]);
			}
		}
		return filterinput;
	}
};

var Schema = mongoose.Schema;
GLOBAL.ObjectId = mongoose.Types.ObjectId;

var contactSchema = new Schema({
	 Name: {type: String, required: true, trim: true},
	 Phone: {type: String, trim: true},
	 Company_Name: {type: String, trim: true},
	 isVerified: Number,
	 Email_Address: {type: String, trim: true},
	 Category: {type: String, trim: true},
	 Address: {type: String, trim: true},
	 City: {type: String, trim: true},
	 Optional: {type: String, trim: true}
},{
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

var accountSchema = new Schema({
	 Name: {type: String, required: true, trim: true},
	 Phone: {type: String, required: true, trim: true},
	 Company_Name: {type: String, required: true, trim: true},
	 isVerified: {type: Number, required: true},
	 Email_Address: {type: String, trim: true},
	 Category: {type: String, trim: true},
	 Address: {type: String, required: true, trim: true},
	 City: {type: String, required: true, trim: true},
	 Optional: {type: String, trim: true}
},{
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

var subscriptionSchema = new Schema({
	Contact_Id: {type: String, required: true, trim: true},
	Account_Id: {type: String, required: true, trim: true}
},{
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

var loginSchema = new Schema({
	Contact_Id: {type: String, required: true, trim: true},
	Username: {type: String, required: true, trim: true},
	Password: {type: String, required: true, trim: true},
	Email_Address: {type: String, required: true, trim: true},
	isBanned: {type: Number, required: true},
	isEmailVerified: {type: Number, required: true},
	isManager: {type: Number, required: true},
	verifyToken: {type: String, trim: true},
	Company_Code: {type: String, required: true, trim: true},
	token: {type: String, trim: true},
	tokenExpiry: {type: String, trim: true},
	resetToken: {type: String, trim: true},
	resetTimestamp: {type: String, trim: true},
},{
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

var companySchema = new Schema({
	Id: {type: String, required: true, trim: true},
	Company_Name: {type: String, required: true, trim: true},
	Manager_Id: {type: String, required: true, trim: true},
},{
	id: false,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

var invitationSchema = new Schema({
	Token_Id: {type: String, required: true, trim: true},
	Timestamp: {type: String, required: true, trim: true},
	Company_Code: {type: String, required: true, trim: true}
},{
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

var calendarSchema = new Schema({
	Contact_Id: {type: String, required: true, trim: true},
    title: {type: String},
    start: {type: String},
    end: {type: String},
    allDay: {type: String},
    url: {type: String},
    description: {type: String}	
},{
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

var leadSchema = new Schema({
	 Contact_Id: {type: String, required: true, trim: true},
     Account_Id: {type: String, required: true, trim: true}, 
     Description: {type: String, trim: true},
     Lead_Source: {type: String, required: true, trim: true},
     Created: {type: Number, required: true, trim: true},
     Status: {type: String, required: true, trim: true}
},{
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

var leadHistorySchema = new Schema({
	Lead_Id: {type: String, required: true, trim: true},
	Timestamp: {type: Number, required: true, trim: true},
	Comment: {type: String, require: true, trim: true},
	Contact_Id: {type: String, required: true, trim: true},
},{
	id: false,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

var orderSchema = new Schema({
	  Contact_Id: {type: String, required: true, trim: true},
      Customer_Id: {type: String, required: true, trim: true},
      Order_Date: {type: Number, required: true, trim: true},
      Order_Deadline: {type: String, trim: true},
      Product_Id: {type: String, required: true, trim: true},
      Quantity: {type: String, required: true, trim: true},
      Description: {type: String, trim: true},
      Status: {type: String, required: true, trim: true},
      Optional1: {type: String, trim: true}
},{
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

var orderHistorySchema = new Schema({
	 Order_Id: {type: String, required: true, trim: true},
     Contact_Id: {type: String, required: true, trim: true},
     Timestamp: {type: Number, required: true, trim: true},
     Comment: {type: String, require: true, trim: true}
},{
	id: false,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

var productSchema = new Schema({
	Contact_Id: {type: String, required: true, trim: true},
    Product_Added: {type: String, required: true, trim: true},
    Product_Segment: {type: String, required: true, trim: true},
    Product_Category: {type: String, required: true, trim: true},
    Product_Name: {type: String, required: true, trim: true},
    Product_Description: {type: String, trim: true},
    Product_Status:	{type: String, required: true, trim: true}
},{
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

var taskSchema = new Schema({
	  Contact_Id: {type: String, required: true, trim: true},
	  Description: {type: String, required: true, trim: true},
	  Created: {type: String, required: true, trim: true},
	  Deadline: {type: String, trim: true},
	  Priority: {type: String, required: true, trim: true},
	  Assigner_Id: {type: String, required: true, trim: true},
	  Related_To: {type: String, trim: true},
	  Status: {type: String, required: true, trim: true}
},{
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

contactSchema.virtual('Contact_Id').get(function() {
	   return this._id;
});
GLOBAL.Contact = mongoose.model('contact', contactSchema);

accountSchema.virtual('Contact_Id').get(function() {
	   return this._id;
});
GLOBAL.Account = mongoose.model('account', accountSchema);

subscriptionSchema.virtual('Subscription_Id').get(function(){
	return this._id;
});
GLOBAL.Subscription = mongoose.model('subscription', subscriptionSchema);

loginSchema.virtual('Login_Id').get(function(){
	return this._id;
});
GLOBAL.Login = mongoose.model('login', loginSchema);

companySchema.virtual('Company_Id').get(function(){
	return this._id;
});
GLOBAL.Company = mongoose.model('company', companySchema);

invitationSchema.virtual('Invitation_Id').get(function(){
	return this._id;
});
GLOBAL.Invitation = mongoose.model('invitation', invitationSchema);

orderSchema.virtual('Order_Id').get(function(){
	return this._id;
});
GLOBAL.Order = mongoose.model('order', orderSchema);

orderHistorySchema.virtual('Id').get(function(){
	return this._id;
});
GLOBAL.OrderHistory = mongoose.model('orderhistory', orderHistorySchema);

leadSchema.virtual('Lead_Id').get(function(){
	return this._id;
});
GLOBAL.Lead = mongoose.model('lead', leadSchema);

leadHistorySchema.virtual('Id').get(function(){
	return this._id;
});
GLOBAL.LeadHistory = mongoose.model('leadhistory', leadHistorySchema);

productSchema.virtual('Product_Id').get(function(){
	return this._id;
});
GLOBAL.Product = mongoose.model('product', productSchema);

taskSchema.virtual('Task_Id').get(function(){
	return this._id;
});
GLOBAL.Task = mongoose.model('task', taskSchema);

calendarSchema.virtual('Calendar_Id').get(function(){
	return this._id;
});
GLOBAL.Calendar = mongoose.model('calendar', calendarSchema);