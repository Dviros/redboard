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
var express			= require('express');
var app				= express();
var morgan			= require('morgan');
var mongoose 		= require('mongoose');
var passport 		= require('passport');
var flash    		= require('connect-flash');
var session  		= require('express-session');
var cookieParser 	= require('cookie-parser');
var bodyParser   	= require('body-parser');
var https			= require('https');
var fs				= require('fs');

/* server config */
var portSSL	= 8443;	
var host    = "127.0.0.1";
var config	= 	{
					key : fs.readFileSync('./ssl/file.pem'),
					cert: fs.readFileSync('./ssl/file.crt')
				}

var version		= "1.0.0";

/* load db config file */
var configDB = require('./config/database.js');

/* connect to database */
mongoose.connect(configDB.url);
mongoose.Promise = require('bluebird');

/* load passport config to passport */
require('./config/passport')(passport);

/* set the view engine to ejs */
app.set('view engine', 'ejs');

/* set default path to theme */
app.use(express.static(__dirname + '/views'));

/* read cookies (needed for auth) */
app.use(cookieParser()); 
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

/* required for passport */
app.use(session({
    secret: 'ilovesponies',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());

/* persistent login sessions */
app.use(passport.session()); 

/* use connect-flash for flash messages */
app.use(flash()); 

/* routes */
require('./app/routes.js')(app, passport, portSSL);

/* init web server */
https.createServer(config, app).listen(portSSL, host);

console.log('version : ' + version);
console.log(portSSL +' is the magic HTTPS port');

