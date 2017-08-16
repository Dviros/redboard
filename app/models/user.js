/* user model */

/* load the things we need */
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

/* define the schema for our model */
var userSchema = mongoose.Schema({

    local            : {
        username     : String,
        password     : String,
        isAdmin		 : { type: Boolean, default: false }
    }
});

/* methods */
/* generating a hash */
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
/* checking if password is valid */
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

/* create the model and expose it to our app */
module.exports = mongoose.model('User', userSchema);

