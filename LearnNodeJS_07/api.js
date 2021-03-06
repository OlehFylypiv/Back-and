const express = require('express');
const router = express.Router();

let passport = require('passport');
let Strategy = require('passport-http').BasicStrategy;

let users = require('./db');
let groups = require('./dbGroups');

const bodyParser = require('body-parser');

const Joi = require('joi');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));


Array.prototype.findByUsername = function (name, cb) {
    
    process.nextTick( () => {
        
        for (let i = 0, len = users.length; i < len; i++) {
        	
        	let record = users[i];
            
            if (record.name === name) {
                return cb(null, record);
            }
        }
    
        return cb(null, null);
    });
}


passport.use(new Strategy(
    
    (name, password, cb) => {
        
        users.findByUsername(name, (err, user) => {
            
            return new Promise( (resolve, reject) => {
                
                if (err) { 
                    reject (cb(err)); 
                }
                
                if (!user) { 
                    reject (cb(null, false)); 
                }
                
                if (user.password != password) { 
                    reject (cb(null, false)); 
                }
                
                resolve (cb(null, user));  
            });
        });
    })
);
     

router.get('/',
    
    passport.authenticate('basic', { session: false }),
    
    (req, res, next) => {
        
        res.json({ 
           	name: req.user.name, 
           	email: req.user.email 
        });
	}
);


router.get('/users', (req, res, next) => {
    res.send(users);
});


router.get('/groups', (req, res, next) => {
    res.send(groups);
});


router.get('/users/:userID', (req, res, next) => {
    
    let user = users.find( (user) => {
        return user.id === req.params.userID;
    });

    res.send(user);
});


router.get('/groups/:groupID', (req, res, next) => {
    
    let group = groups.find( (group) => {
        return group.id === req.params.groupID;
    });

    res.send(group);
});


router.post('/users', (req, res, next) => {
    
    let user = req.body;

    function validation() {
        
        return new Promise( (resolve, reject) => {
            
            setTimeout( 
            	
            	() => {
                
                	let schema = Joi.object({
        	        	name: Joi.string().min(4).max(20).required(),
                    	password: Joi.string().alphanum().min(8).required(),
        	        	email: Joi.string().email(),
        	        	role: Joi.string().valid('superadmin', 'admin', 'user').required(),
                    	id: Joi.number().min(12).required()
                	});

                	let result = Joi.validate(user, schema);
                
                	if (!result.error) {
                    	resolve('Good user validation');
                	}
                	else {
                    	reject('Invalid post user validation');
                	}
            	}, 
            	
            	1000
            );
        });
    }
    
    async function doValidation() {
      	
      	try { 
        	let result = await validation();
      	}
      	catch(e) {
        	throw new Error(e);
      	}
    }
    
    doValidation();
    
    function addPeople() {
            
        return new Promise( (resolve, reject) => {
            
            let counterSuperAdmin = 0;
            let counterAdmin = 0;
    
        	for (let user of users) {
        
            	if (user.role === 'superadmin') {
                	counterSuperAdmin++;
            	}
            
            	if (user.role === 'admin') {
                	counterAdmin++;
            	}
        	}
    
        	if (counterSuperAdmin < 1 && counterAdmin < 2 ) {
            	resolve('User added');
        	}
        	else {
            	reject('Only 1 superadmin and 2 admins');
        	}
        });
    }
    
    addPeople()
    	.then( () => {
        	
        	user.id = new Date().getTime();
    
         	users.push(user);
    
         	res.send(user);
        });
});


router.post('/groups', (req, res, next) => {
    
    let group = req.body;

    function addGroup() {
        
        return new Promise( (resolve, reject) => {
            
            let schema = Joi.object({
         		name: Joi.string().min(4).max(20).required(),
         		users: Joi.array().max(10).required()
        	});

    		let resultValidation = Joi.validate(group, schema);
    
    		if (!resultValidation.error) {
        		resolve('Good group validation');
    		}
    		else {
        		reject('Invalid group validation');
    		}
        });
    }

   	addGroup()
    	.then( () => {
        	
        	group.id = new Date().getTime();
    
        	groups.push(group);
    
        	res.send(group);
    	}); 
});


router.post('/users/:userID', (req, res, next) => {
    
    let getGroupId = req.query;

    function addUserToGroup() {
        
        return new Promise( (resolve, reject) => {
            
            let group = groups.find( (group) => {
                return group.id == getGroupId.group;
            });
    
    		if (group) {
        		resolve('User added in the group');
    		}
    		else {
        		reject('This group is not defined');
    		}
        });
    }

    addUserToGroup()
        .then( () => {
            
            group.users.push(req.params.userID);
        
            res.send(group);
        });
});


router.put('/users/:userID', (req, res, next) => {

    function putUser() {
        
        return new Promise( (resolve, reject) => {
            
            let user = users.find( (user) => {
                return user.id === req.params.userID; 
            });

            let schema = Joi.object({
        	    name: Joi.string().min(4).max(20).required(),
        	    password: Joi.string().alphanum().min(8).required(),
        	    email: Joi.string().email(),
        	    role: Joi.string().valid('superadmin', 'admin', 'user').required(),
                id: Joi.number().min(12).required()
            });

    		let resultValidation = Joi.validate(user, schema);
    
    		if (resultValidation.error) {
        		reject('Invalid put user');
    		}
    		else {
        		resolve('User data was changed');
    		}
        });
    }

    putUser()
        .then( () => {
            
            user.name = req.body.name;
            user.password = req.body.password;
            user.email = req.body.email;
           	user.role = req.body.role;
    
            res.send(user);
        });
});


router.put('/groups/:groupID', (req, res, next) => {
    
    function putGroup() {
        
        return new Promise( (resolve, reject) => {
            
            let group = groups.find( (group) => {
        		return group.id === req.params.groupID; 
    		});

    		let schema = Joi.object({
         		name: Joi.string().min(4).max(20).required(),
         		users: Joi.array().max(10).required()
    		});

    		let resultValidation = Joi.validate(group, schema);
    
    		if (resultValidation.error) {
        		reject('Invalid put group');
    		}
    		else {
       			resolve('Group data was changed');
    		}
        });
    }

    putGroup()
        .then( () => {
            
            group.name = req.body.name;
            group.users = req.body.users;

            res.send(group);
        });
});


router.delete('/users/:userID', (req, res, next) => {
    
    users = users.filter( (user) => {
        return user.id !== req.params.userID;
    });
    
    for (let i = 0; i < groups.length; i++) {
        
        let index = groups[i].users.indexOf(req.params.userID);
        
        if (index !== -1) {
            groups[i].users.splice(index, 1);
        }
        else {
            continue;
        }
    }
    
    res.send(users);
});


router.delete('/groups/:groupID', (req, res, next) => {
    
    groups = groups.filter( (group) => {
        return group.id !== req.params.groupID;
    });

    res.send(groups);
});


router.delete('/groups/:groupID/delete/:userID', (req, res, next) => {
    
    let group = groups.find( (group) => {
        return group.id === req.params.groupID; 
    });
    
    if (group.users.length === 1) {
        res.send('Can not delete the last user');
    }
    
    let index = group.users.indexOf(req.params.userID);
    
    group.users.splice(index, 1);

    res.send(group);

});

module.exports = router;