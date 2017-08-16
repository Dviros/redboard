/**
 * This file is part of Redboard.
 * Copyright (C) 2017  @redhunter0x27
 *
 * Redboard is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Redboard is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with huborcid.  If not, see <http://www.gnu.org/licenses/>.
 */

/* load the things we need */
var LocalStrategy		  = require('passport-local').Strategy;
var LocalAPIKeyStrategy   = require('passport-localapikey').Strategy;

/* load up db models */
var User				  = require('../app/models/user');

/* expose this function to our app using module.exports */
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================

    /* used to serialize the user for the session */
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    /* used to deserialize the user */
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================

    passport.use('local-signup', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, username, password, done) {
        process.nextTick(function() {
			/* checking to see if the user trying to login already exists */
			User.findOne({ 'local.username' :  username }, function(err, user) {
				if (err) return done(err);

				/* check special char */
				if( isValid(username) == false) {
					return done(null, false, req.flash('signupMessage', 'That login contain invalid char.'));
				}
				
				/* check username length */
				if( username.length >= 256) {
					return done(null, false, req.flash('signupMessage', 'Login too long (limit at 256 char).'));
				}				
				
				/* check to see if theres already a user with that login */
				if (user) {
					return done(null, false, req.flash('signupMessage', 'That login is already taken.'));
				} else {
					/* if there is no user with that login, create the user */
					var newUser            = new User();

					newUser.local.username	= username;
					newUser.local.password 	= newUser.generateHash(password);
					newUser.local.isAdmin	= req.body.optionsRadiosInline;

					/* save the user */
					newUser.save(function(err) {
						if (err) throw err;
						return done(null, newUser);
					});
				}

			});    

        });

    }));
    
    // =========================================================================
    // LOCAL UPDATE USER ACCOUT ================================================
    // =========================================================================

    passport.use('local-update', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, username, password, done) {
        process.nextTick(function() {
			/* checking to see if the user trying to login already exists */
			User.findOne({ 'local.username' :  req.user.local.username }, function(err, user) {
				if (err) return done(err);

				/* check to see if theres already a user with that email */
				if (user) {
					/* if there is user update */
					user.local.username = req.user.local.username;
					user.local.password = user.generateHash(password);
					
					/* save the update user */
					user.save(function(err) {
						req.logIn(user, function(err) {
							return done(err, user, req.flash('UpdateMessage', 'Update with sucess.'));
						});
					});
				}else{
					return done(null, false, req.flash('UpdateMessage', 'That login does not exist.'));
				}

			});    
        });

    }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================

    passport.use('local-login', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, username, password, done) { 
		/* checking to see if the user trying to login already exists */
        User.findOne({ 'local.username' :  username }, function(err, user) {
            if (err) return done(err);

            /* if no user is found, return the message */
            if (!user)
                return done(null, false, req.flash('loginMessage', 'Oops! - No user found or Wrong password.'));

            /* if the user is found but the password is wrong */
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! - No user found or Wrong password.')); 

            /* all is well, return successful user */
            return done(null, user);
        });

    }));

    /* check valid char */
	function isValid(str) {
		var iChars = "~`!#$%^&*+=-[]\\\';,/{}|\":<>?";

		for (var i = 0; i < str.length; i++) {
		   if (iChars.indexOf(str.charAt(i)) != -1) {
			   return false;
		   }
		}
		return true;
	} 
   
};

