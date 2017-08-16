/* project model */

/* load the things we need */
var mongoose = require('mongoose');

/* define the schema for our model */
var projectSchema = mongoose.Schema({
        snap     		: { type: Object, default: "" },        
});

/* create the model and expose it to our app */
module.exports = mongoose.model('Project', projectSchema);
