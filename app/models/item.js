/* item model */

/* load the things we need */
var mongoose = require('mongoose');
 
/* define the schema for our model */
var itemSchema = mongoose.Schema({
		name		 : { type: String, default: "" },
		ip			 : { type: String, default: "" },
		os			 : { type: String, default: "unknown" },
		owned		 : { type: String, default: "0" },				
        status		 : { type: String, default: "valid" },
		category	 : { type: String, default: "" },
		subcategory	 : { type: String, default: "" },
		backdoorID	 : { type: String, default: "" },
		bdDay		 : { type: String, default: "0" },	
		bdHour		 : { type: String, default: "0" },
		bdMin		 : { type: String, default: "0" },
		attachItems	 : [ String ],
		description	 : { type: String, default: "" },
        owner		 : String,
        date		 : { type: Date, default: Date.now },
        draw		 : { type: String, default: "1" },
        updateDate	 : { type: Date, default: "" }
});

/* create index to perform a full text search, index all */
itemSchema.index({'$**' : 'text'});

/* create the model and expose it to our app */
module.exports = mongoose.model('Item', itemSchema);

