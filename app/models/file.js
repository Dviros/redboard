/* file model */

/* load the things we need */
var mongoose = require('mongoose');
 
/* define the schema for our model */
var fileSchema = mongoose.Schema({
		itemID		 : String,
		name 		 : { type: String, default: "" },
		type		 : { type: String, default: "" },		
		data		 : { type: Buffer, default: "" }
});

/* create index to perform a full text search, index all */
fileSchema.index({'$**' : 'text'});

/* create the model and expose it to our app */
module.exports = mongoose.model('File', fileSchema);
