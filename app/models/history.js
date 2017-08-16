/* history model */

/* load the things we need */
var mongoose = require('mongoose');

/* define the schema for our model */
var historySchema = mongoose.Schema({
        status		: { type: Number, default: 10 },
        reason		: { type: String, default: "" },
        date		: { type: Date, default: Date.now }
});

/* create the model and expose it to our app */
module.exports = mongoose.model('History', historySchema);
