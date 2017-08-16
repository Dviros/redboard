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

/* load up db models */
var Project         	= require('./models/project');
var Item            	= require('./models/item');
var File            	= require('./models/file');
var History            	= require('./models/history');
var Users         		= require('./models/user');

/* load the things we need */
var multipart 			= require('connect-multiparty');
var multipartMiddleware	= multipart();
var fs					= require('fs');

module.exports = function(app, passport, portSSL) {
	
	/* add delete method */
	app.use( function( req, res, next ) {
		if ( req.query._method == 'DELETE' ) {
			/* change the original METHOD, into DELETE method */
			req.method = 'DELETE';
			/* and set requested to url */
			req.url = req.path;
		}       
		next(); 
	});

    // =====================================
    // HOME PAGE (login page) ==============
    // =====================================
    app.get('/', function(req, res) {
		/* load the index.ejs file */
        res.render('pages/index', { message: req.flash('loginMessage') }); 
    });

  	/* process the login form */
    app.post('/', passport.authenticate('local-login', {
        successRedirect : '/project-dashboard', 
        failureRedirect : '/', 
        failureFlash : true // allow flash messages
    }));


    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    app.get('/profile', isLoggedIn, function(req, res) {
		/* save url to back without using referer */
		req.session.profileBackURL = "/profile";
		
        res.render('pages/profile', {
            user : req.user, // get the user out of session and pass to template
            message: req.flash('UpdateMessage')
        });
    });

    /* process the update profile form */
    app.post('/profile', isLoggedIn, passport.authenticate('local-update', {
			successRedirect : '/profile-redirect',
			failureRedirect : '/profile-redirect',
			failureFlash : true
	}));
    
    app.get('/profile-redirect', isLoggedIn, function(req, res) {
		res.redirect(req.session.profileBackURL);
    });    
    	    
    // =====================================
    // DASHBOARD SECTION ===================
    // =====================================
	
	/* dashboard */
    app.get('/project-dashboard', isLoggedIn, function(req, res) {	
		/* save url to back without using referer */
		req.session.itemEditBackURL = '/project-dashboard';
				
		Project.findOne({}).exec(function(err, project) {
			if (err) res.redirect('/dashboard');
			Item.find({ "category": "vuln", "status": "valid"}).count(function(err, nbVuln) {
				if (err) throw err;
			Item.find({ "category": "vuln" }).distinct('subcategory', function(err, vulnSubCat) {
				if (err) throw err;				
			Item.find({ "category": "host", "status": "valid"}).count(function(err, nbHost) {
				if (err) throw err;			
			Item.find({ "category": "host" }).distinct('subcategory', function(err, hostSubCat) {
				if (err) throw err;									
			Item.find({ "category": "password", "status": "valid"}).count(function(err, nbPassword) {
				if (err) throw err;					
			Item.find({ "category": "password" }).distinct('subcategory', function(err, passwordSubCat) {
				if (err) throw err;											
			Item.find({ "category": "backdoor", "status": "valid"}).count(function(err, nbBD) {
				if (err) throw err;					
			Item.find({ "category": "backdoor" }).distinct('subcategory', function(err, backdoorSubCat) {
				if (err) throw err;													
			Item.find({ "category": "tips", "status": "valid"}).count(function(err, nbTips) {
				if (err) throw err;				
			Item.find({ "category": "tips", "subcategory": { $nin : [ "network", "windows", "linux", "web", "db", "tools", "appliance", "exploit" ]}}).distinct('subcategory', function(err, tipsSubCat) {
				if (err) throw err;				
			Item.find({ "category": "resource", "subcategory": "vps", "status": "valid"}).count(function(err, nbVPS) {
				if (err) throw err;	
			Item.find({ "category": "resource", "subcategory": "dns", "status": "valid"}).count(function(err, nbDNS) {
				if (err) throw err;								
			Item.find({ "category": "resource", "subcategory": "certificat", "status": "valid"}).count(function(err, nbCert) {
				if (err) throw err;
			Item.find({ "category": "resource", "subcategory": { $nin : [ "vps", "dns", "certificat" ]}}).distinct('subcategory', function(err, resourceSubCat) {
				if (err) throw err;						
				History.find({}).exec(function(err, history) {
					if (err) throw err;				
					Item.find({}).select("date").exec(function(error, dates) {
						if (err) throw err;
					Item.find({}).select("updateDate").exec(function(error, updateDates) {
						if (err) throw err;
						var arrDate = [];
						var arrUpdateDate = [];
						/* add all date without time to array */
						/* date */
						dates.forEach(function(objDate){
							if (err) throw err;
							ISOdate = new Date(objDate.date.setHours(12)).toISOString();													
							var date = ISOdate.split("T")[0];
							arrDate.push(date);
						});
						/* update date */
						updateDates.forEach(function(objDate){
							if(typeof objDate.updateDate != 'undefined'){
								if(objDate.updateDate != null){
									if (err) throw err;
									ISOdate = new Date(objDate.updateDate.setHours(12)).toISOString();
									var date = ISOdate.split("T")[0];
									arrUpdateDate.push(date);
								}
							}
						});
											
						/* count items by date */
						/* date */
						var itemByDateCounts = {};
																	
						for (var i = 0; i < arrDate.length; i++) {
							itemByDateCounts[arrDate[i]] = 1 + (itemByDateCounts[arrDate[i]] || 0);
						}
						/* update date */
						var itemByUpdateDateCounts = {};
																						
						for (var i = 0; i < arrUpdateDate.length; i++) {
							itemByUpdateDateCounts[arrUpdateDate[i]] = 1 + (itemByUpdateDateCounts[arrUpdateDate[i]] || 0);
						}
							
						/* add date with it's count into array */
						/* date */											
						var itemByDateArr = [];

						for(var key in itemByDateCounts){									
							var itemByDateObj = {};
												
							itemByDateObj.date 	= new Date(key.replace(/-/g, '/')).setHours(8);
							itemByDateObj.count = itemByDateCounts[key];
											
							itemByDateArr.push(itemByDateObj);
						}											
						/* update date */
						var itemByUpdateDateArr = [];

						for(var key in itemByUpdateDateCounts){									
							var itemByUpdateDateObj = {};
											
							itemByUpdateDateObj.date 	= new Date(key.replace(/-/g, '/')).setHours(8);
							itemByUpdateDateObj.count = itemByUpdateDateCounts[key];
											
							itemByUpdateDateArr.push(itemByUpdateDateObj);
						}																							
							
						Item.find({ "category": "host", "status": "valid", "draw": { $ne : "0" } }).exec(function(err, itemGraph) {
							if (err) throw err;	
							Item.find({ "category": "backdoor", "status": "valid" }).exec(function(err, itemBD) {									
								if (err) throw err;	
									var currDate = new Date();
									res.render('pages/project-dashboard', {
										project				: project,
										itemGraph			: itemGraph,
										itemBD				: itemBD,
										currDate			: currDate,
										itemByDateArr		: itemByDateArr,
										itemByUpdateDateArr	: itemByUpdateDateArr,
										history				: history,
										nbVuln				: nbVuln,
										nbHost				: nbHost,
										nbPassword 			: nbPassword,
										nbBD				: nbBD,
										nbTips				: nbTips,
										nbVPS				: nbVPS,
										nbDNS				: nbDNS,
										nbCert				: nbCert,
										vulnSubCat			: vulnSubCat,
										hostSubCat			: hostSubCat,
										passwordSubCat		: passwordSubCat,
										backdoorSubCat		: backdoorSubCat,
										tipsSubCat			: tipsSubCat,
										resourceSubCat		: resourceSubCat,
										user 				: req.user
									});
								});
							});
						});
						});
				});
			});
			});	
			});
			});
			});
			});
			});
			});
			});
			});
			});
			});
			});
			});				
		});
    });	
                                
	/* post dashboard : add new item or snap map position */
    app.post('/project-dashboard', isLoggedIn, function(req, res) {
		/* if snap position */
		if(typeof req.body.snap != 'undefined'){
			Project.findOne({}).exec(function(err, project) {
				if(project){				
					project.snap = req.body.snap;			
				}else{
					var project = new Project({
						snap : req.body.snap
					});				
				}
				project.save(function(err) {
					if (err) throw err;
					res.redirect('/project-dashboard');
				});					
			});	
		/* else create new item	*/
		}else{	
			Item.find({}, function(err, items) {
				if (err) throw err;
				res.render('pages/item-new', {
					items			: items,
					category		: req.body.category,
					subcategory	 	: req.body.subcategory,
					user : req.user
				});
			});
		}
    });	
    
    // =====================================
    // ITEM SECTION ========================
    // =====================================    
    
	/* add new item */
	app.post('/item-new', isLoggedIn, multipartMiddleware, function(req, res) {
		/* check draw status */
		if( req.body.draw == "on"){
			var draw = 1;
		}else{
			var draw = 0;
		}
		
		var item 	= new Item({
				name 		: req.body.name,
				ip	 		: req.body.ip,
				os	 		: req.body.os,
				owned		: req.body.owned,
				attachItems	: req.body.attachItems,
				description : req.body.description,
				status		: req.body.status,
				category	: req.body.category,
				subcategory	: req.body.subcategory,
				owner		: req.user.local.username,
				backdoorID 	: req.body.backdoorID,
				bdMin 		: req.body.bdMin,
				bdHour 		: req.body.bdHour,
				bdDay 		: req.body.bdDay,
				draw		: draw						
		});
												
		/* test if file is select to upload */
		if (req.files.file[0].size != 0){
			/* upload file(s) */
			if (Array.isArray(req.files.file)) {
				req.files.file.forEach(function(uniqFile){
					fs.readFile(uniqFile.path, function(err,data) {
						if (err) throw err;
						
						var file 	= new File({
							itemID 		: item._id,
							name		: uniqFile.originalFilename,
							type		: uniqFile.type,
							data		: data
						});
		
						file.save(function(err) {
							if (err) throw err;
						});
					});		
					fs.unlink(uniqFile.path);					
				});
			}
		}
							
		item.save(function(err) {
			if (err) throw err;
			res.redirect('/project-dashboard');
		});
    });
    
	/* show all items */
    app.get('/item', isLoggedIn, function(req, res) {
		/* save url to back without using referer */
		req.session.itemBackURL = "/item";
		req.session.itemEditBackURL = "/item";
		
		Item.find({}).sort({"date": -1}).exec( function(err, items) {
			if (err) throw err;
			Item.find({}).distinct('subcategory', function(err, itemsSubcat) {
				if (err) throw err;
				res.render('pages/item', {
					items 	  	: items,
					itemsSubcat	: itemsSubcat,
					category  	: "All",
					user 		: req.user
				});
			});
		});
    });
    
	/* show selected item */
    app.get('/item-category-:category', isLoggedIn, function(req, res) {
		/* save url to back without using referer */
		req.session.itemBackURL = '/item-category-' + req.params.category;
		req.session.itemEditBackURL = '/item-category-' + req.params.category;
			
		if (req.params.category == "other") {
			Item.find({ "category": { $nin : [ "vuln", "host", "password", "backdoor", "tips", "resource" ] }}, function(err, items) {
				if (err) res.redirect('/project-dashboard');
				Item.find({ "category": { $nin : [ "vuln", "host", "password", "backdoor", "tips", "resource" ] }}).distinct('subcategory', function(err, itemsSubcat) {
					if (err) res.redirect('/project-dashboard');
					res.render('pages/item', {
						items 	 	: items,
						itemsSubcat	: itemsSubcat,
						category 	: req.params.category,
						user 		: req.user
					});
				});
			});				
		}else{
			Item.find({"category": req.params.category }).sort({"date": -1}).exec( function(err, items) {
				if (err) res.redirect('/project-dashboard');
				Item.find({ "category": req.params.category }).distinct('subcategory', function(err, itemsSubcat) {
					if (err) res.redirect('/project-dashboard');
					res.render('pages/item', {
						items 		: items,
						itemsSubcat	: itemsSubcat,
						category 	: req.params.category,
						user 		: req.user
					});
				});
			});
		}
    });
    
	/* show item filter by date */
    app.get('/item-date-:filter-:date', isLoggedIn, function(req, res) {	
		if (req.params.filter == "at") {
			var date = new Date(Number(req.params.date)).toISOString().split("T")[0];
			
			Item.find({ "date": { "$gte":  new Date(date.replace(/-/g, '/')).setHours(00) , "$lt": new Date(date.replace(/-/g, '/')).setHours(24) }}).sort({"date": -1}).exec(function(err, items) {
				if (err) res.redirect('/project-dashboard');
				Item.find({ "updateDate": { "$gte":  new Date(date.replace(/-/g, '/')).setHours(00) , "$lt": new Date(date.replace(/-/g, '/')).setHours(24) }}).sort({"updateDate": -1}).exec(function(err, updateItems) {
					if (err) res.redirect('/project-dashboard');
					res.render('pages/item', {
						items 		: items,
						updateItems	: updateItems,
						category 	: " New ",
						filter		: "AtDate : " + date,
						user : req.user
					});
				});
			});				
		} else if (req.params.filter == "since") {
			var date = new Date(Number(req.params.date)).toISOString().split("T")[0];
			
			Item.find({ "date": { "$gte":  new Date(date.replace(/-/g, '/')).setHours(00) }}).sort({"date": -1}).exec(function(err, items) {
				if (err) res.redirect('/project-dashboard');
				Item.find({ "updateDate": { "$gte":  new Date(date.replace(/-/g, '/')).setHours(00) }}).sort({"updateDate": -1}).exec(function(err, updateItems) {
					if (err) res.redirect('/project-dashboard');
					res.render('pages/item', {
						projectID : req.params.id,
						items : items,
						updateItems	: updateItems,
						category : " New ",
						filter	 : "SinceDate : " + date,
						user : req.user
					});
				});
			});
		} else {
			res.render('pages/item', {
				items : "",
				category : "No Filter Found",
				user : req.user
			});				
		}
    });    

    /* delete item */
	app.delete('/item/:id', isLoggedIn, function(req, res) {									
		Item.findById(req.params.id).exec(function(err, item) {
				if (err) res.redirect('/project-dashboard');
				item.remove(function(err) {
					if (err) throw err;
					res.redirect(req.session.itemBackURL);
				});
		});
	});
	
    /* delete attach item */
	app.get('/item-attach-:id', isLoggedIn, function(req, res) {
		var urlOrigID = req.session.fileBackURL.split("-")[2];
	
		Item.findById(urlOrigID).exec(function(err, item) {
			if (err) res.redirect('/project-dashboard');
			
			item.update( { $pullAll: { attachItems: [req.params.id] } }, function(err) {
				if (err) throw err;
				res.redirect(req.session.fileBackURL);
			});
		});
	});
	
	/* update item get */
    app.get('/item-edit-:id', isLoggedIn, function(req, res) {
		/* save url to back without using referer */
		req.session.fileBackURL = '/item-edit-' + req.params.id;
		
		Item.findById(req.params.id).exec(function(err, item) {
			if (err) res.redirect('/project-dashboard');		
			Item.find({}, function(err, items) {
				if (err) res.redirect('/project-dashboard');
				File.find({ itemID : req.params.id }, function(err, files) {
					res.render('pages/item-edit', {
						item  : item,
						items : items,
						files : files,
						user : req.user
					});
				});
			});
		});
    });
	
	/* update item post */
	app.post('/item-edit-:id', isLoggedIn, multipartMiddleware, function(req, res) {
		Item.findById(req.params.id).exec(function(err, item) {
			if (err) res.redirect('/project-dashboard');
					
			/* check draw status */
			if( req.body.draw == "on"){
				var draw = 1;
			}else{
				var draw = 0;
			}			
				
			if ( item ) {
				item.name 			= req.body.name;
				item.ip		 		= req.body.ip;
				item.os	 			= req.body.os;
				item.owned			= req.body.owned;
				item.status 		= req.body.status;
				item.subcategory 	= req.body.subcategory;
				item.description 	= req.body.description;
				item.updateDate 	= new Date();
				item.owner		 	= req.user.local.username;
				item.backdoorID 	= req.body.backdoorID;
				item.bdMin 			= req.body.bdMin;
				item.bdHour 		= req.body.bdHour;
				item.bdDay 			= req.body.bdDay;
				item.draw			= draw;
								
				/* test if attach item */
				if (typeof req.body.attachItems != 'undefined') { 
					/* item(s) attach */
					if (Array.isArray(req.body.attachItems)) {
						req.body.attachItems.forEach(function(OneItem){
							if ( item.attachItems.indexOf(OneItem) === -1){
								item.attachItems.push(OneItem)	 
							}
						});
					}
				}				
								
				/* test if file is select to upload */
				if (req.files.file[0].size != 0){
					/* upload file(s) */
					if (Array.isArray(req.files.file)) {
						req.files.file.forEach(function(uniqFile){
							fs.readFile(uniqFile.path, function(err,data) {
								if (err) throw err;
								var file 	= new File({
									itemID 		: req.params.id,
									name		: uniqFile.originalFilename,
									type		: uniqFile.type,
									data		: data
								});

								file.save(function(err) {
									if (err) throw err;
								});
							});	
							fs.unlink(uniqFile.path);					
						});
					}
				}else{
					fs.unlink(req.files.file[0].path);
				}
				item.save(function(err) {
					res.redirect(req.session.itemEditBackURL);
				});
			}else{
				return done(null, false, req.flash('UpdateMessage', 'That item does not exist.'));
			}
		});
	});
	
    // =====================================
    // FILE ================================
    // =====================================	
    app.get('/file-delete-:id', isLoggedIn, function(req, res) {
		File.findById(req.params.id).exec(function(err, file) {
			if (err) res.redirect('/project-dashboard');
			redirURL = "/item-edit-" + file.itemID;	
			File.remove({ _id: req.params.id }, function(err, file) {
				if (err) res.redirect('/project-dashboard');
				res.redirect(redirURL);		
			});
		});	
	});

    app.get('/file-show-:id', isLoggedIn, function(req, res) {
		File.findById(req.params.id).exec(function(err, file) {
			if (err) res.redirect('/project-dashboard');
			
			if (file.type != ""){
				res.setHeader("Content-Type", file.type);
			}
			
			res.setHeader('Content-Disposition', 'inline; filename=' + file.name);							
			res.send(file.data);
		});
	});

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // =====================================
    // SEARCH ==============================
    // =====================================
    app.get('/search', isLoggedIn, function(req, res) {
		Item.find({}).distinct('category', function(err, items) {
			if (err) throw err;
			res.render('pages/search', {
				items		:	items,
				resultItems :	[ "" ],
				resultFiles :	[ "" ],
				searchInput :	"",
				user 		:	req.user 
			});
		});
    });
    
    app.post('/search', isLoggedIn, function(req, res) {
		/* save url to back without using referer */
		req.session.itemEditBackURL = "/search";

		Item.find({}).distinct('category', function(err, items) {
			if (err) throw err;
			if ( req.body.filter == 'all' ) {
				Item.find({ $text : { $search : req.body.searchInput } }).sort({"date": -1}).exec(function(err, resultItems) {
					File.find({ $text : { $search : req.body.searchInput }}).sort({"date": -1}).exec(function(err, resultFiles) {
						res.render('pages/search', {
							items		:	items,
							resultItems :	resultItems,
							resultFiles :	resultFiles,
							searchInput :	req.body.searchInput,
							user 		:	req.user 
						});
					});
				});						
			}else if ( req.body.filter.indexOf('category') > -1 ) {
				var category = req.body.filter.split("-")[1];
				Item.find({ "category" : category, $text : { $search : req.body.searchInput }}).sort({"date": -1}).exec(function(err, resultItems) {
					File.find({ "category" : category, $text : { $search : req.body.searchInput }}).sort({"date": -1}).exec(function(err, resultFiles) {
						res.render('pages/search', {
							items		:	items,
							resultItems :	resultItems,
							resultFiles :	resultFiles,
							searchInput :	req.body.searchInput,
							user 		:	req.user
						});
					});
				});					
			}else if (( req.body.filter === 'files' ) || ( req.body.filter === 'all' ) ) {
				File.find({ $text : { $search : req.body.searchInput }}).sort({"date": -1}).exec(function(err, resultFiles) {
					res.render('pages/search', {
						items		:	items,
						resultItems :	[ "" ],
						resultFiles :	resultFiles,
						searchInput :	req.body.searchInput,
						user 		:	req.user
					});
				});						
			}
		});
    }); 
    
    // =====================================
    // RANKING ============================
    // =====================================
    app.get('/ranking', isLoggedIn, function(req, res) {
		Users.distinct( "local.username").exec(function(err, users) {
			Item.aggregate([{ $match: { '$or': [ { "category" : "vuln" }, { "category" : "host" }, { "category" : "password" }, { "category" : "backdoor" }, { "category" : "tips" }], "status" : "valid", "owner": { $in: users }}}, {$group: { _id: '$owner', count: { $sum: 1 }}}, { $sort: { count: -1 } }]).exec(function(err, itemAll) {
			Item.aggregate([{ $match: { "category" : "vuln", "status" : "valid", "owner": { $in: users }}}, {$group: { _id: '$owner', count: { $sum: 1 }}}, { $sort: { count: -1 } }]).exec(function(err, itemVuln) {
			Item.aggregate([{ $match: { "category" : "host", "status" : "valid", "owner": { $in: users }}}, {$group: { _id: '$owner', count: { $sum: 1 }}}, { $sort: { count: -1 } }]).exec(function(err, itemHost) {
			Item.aggregate([{ $match: { "category" : "password", "status" : "valid", "owner": { $in: users }}}, {$group: { _id: '$owner', count: { $sum: 1 }}}, { $sort: { count: -1 } }]).exec(function(err, itemPass) {
			Item.aggregate([{ $match: { "category" : "backdoor", "status" : "valid", "owner": { $in: users }}}, {$group: { _id: '$owner', count: { $sum: 1 }}}, { $sort: { count: -1 } }]).exec(function(err, itemBD) {
			Item.aggregate([{ $match: { "category" : "tips", "status" : "valid", "owner": { $in: users }}}, {$group: { _id: '$owner', count: { $sum: 1 }}}, { $sort: { count: -1 } }]).exec(function(err, itemTips) {
				res.render('pages/ranking', {
					itemAll		:	itemAll,
					itemVuln	:	itemVuln,
					itemHost	:	itemHost,
					itemPass	:	itemPass,
					itemBD		: 	itemBD,
					itemTips	:	itemTips,
					user 		: 	req.user
				});
			});	
			});
			});
			});
			});
			});	
		});
    });    
    
    // =====================================
    // user ===============================
    // =====================================
    
    /* check if isAdmin */
    app.all('/user-new', isLoggedIn, function(req, res, next) {
		if (req.user && req.user.local.isAdmin === true){
				next();
		}else{
			res.sendStatus(401).send('Unauthorized');
		}
	});
	
    app.all('/user', isLoggedIn, function(req, res, next) {
		if (req.user && req.user.local.isAdmin === true){
				next();
		}else{
			res.sendStatus(401).send('Unauthorized');
		}
	});	
	
    app.all('/users', isLoggedIn, function(req, res, next) {
		if (req.user && req.user.local.isAdmin === true){
				next();
		}else{
			res.sendStatus(401).send('Unauthorized');
		}
	});	
	
    app.all('/users/:username', isLoggedIn, function(req, res, next) {
		if (req.user && req.user.local.isAdmin === true){
				next();
		}else{
			res.sendStatus(401).send('Unauthorized');
		}
	});	

	/* user-new */
    app.get('/user-new', isLoggedIn, function(req, res) {
		Users.find({}, function(err, users) {
			if (err) throw err;
			res.render('pages/user-new', {
				message: req.flash('signupMessage'),
				user  	: req.user // get the user out of session and pass to template
			});
		});
	}); 
	
    /* create new user account */
    app.post('/user-new', passport.authenticate('local-signup', {
		session			: false,	// dot not create session (authenticate user) after create account
        successRedirect : '/users', 
        failureRedirect : '/user-new',
        failureFlash : true // allow flash messages
    }));
    
	/* list users */
    app.get('/users', isLoggedIn, function(req, res) {
		Users.find({}, function(err, users) {
			if (err) throw err;		
			res.render('pages/users', {
				message: req.flash('signupMessage'),
				users : users,
				user  : req.user // get the user out of session and pass to template
			});
		});
	});     
	
    /* delete user */
	app.delete('/users/:username', isLoggedIn, function(req, res) {
		Users.remove({ "local.username": req.params.username }, function(err) {
			if (err) res.redirect('/users');
			res.redirect('/users');
		});	
	});
};	
		    	        
/* route middleware to make sure a user is logged in */
function isLoggedIn(req, res, next) {
    /* if user is authenticated in the session, carry on */
    if (req.isAuthenticated()) return next();

    /* else redirect them to the home page */
    res.redirect('/');
}
