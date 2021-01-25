//Dependences
const helpers = require('./helpers');
const _data = require('../lib/lib');

const handlers = {};

handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.includes(data.method)) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._users = {};

//Required: firstName, lastName, phone, password, tosAgreement
handlers._users.post = (data, callback) => {

  let { firstName, lastName, phone, password, tosAgreement } = data.payload;

  firstName = firstName && firstName.trim().length > 0 ? firstName.trim() : false;
  lastName = lastName && lastName.trim().length > 0 ? lastName.trim() : false;
  phone = phone && phone.trim().length === 10 ? phone.trim() : false;
  password = password && password.trim().length > 0 ? password.trim() : false;
  tosAgreement = typeof tosAgreement === 'boolean' ? true : false; 

  if (firstName, lastName, phone, password, tosAgreement) {
    _data.read('users', phone, (err, data) => {
      if (err) {
        const hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          const userObject = {
            firstName, 
            lastName, 
            phone, 
            password, 
            tosAgreement: true, 
            hash: hashedPassword,
          };

          _data.create('users', phone, userObject, err => {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, {'Error': 'Could not create the new user'});
            }
          });
        } else {
          callback(500, {"Error":"Could not hash the user's password"});
        }
      } else {
        console.log('err',err)
        callback(400, {'Error': 'User with that phone already exists'});
      }
    });
  } else {
    callback(404,{'Error': 'Missing required fields'});
  }

};

handlers._users.get = (data, callback) => {
  let { phone } = data.queryStringObject;
  phone = phone.trim().length === 10 && typeof phone === 'string' ? phone : false;
  if (phone) {
    _data.read('users', phone, (err, data) => {
      if(!err) {
        delete data.hash;
        callback(200, data);
      } else {
        callback(404);
      } 
    });
  } else {
    callback(400, {'Error': 'Missing required field'})
  }
};

handlers._users.put = (data, callback) => {

  phone = data.payload.phone && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;

  if(phone) {

    let { firstName, lastName, password } = data.payload;

    firstName = firstName && firstName.trim().length > 0 ? firstName.trim() : false;
    lastName = lastName && lastName.trim().length > 0 ? lastName.trim() : false;
    password = password && password.trim().length > 0 ? password.trim() : false;

    if(firstName || lastName || password) {
      _data.read('users', phone, (err, data) => {
        if(!err) {
          if(firstName) data.firstName = firstName;
          if(lastName) data.lastName = lastName;
          if(password) data.password = helpers.hash(password);
          _data.update('users', phone, data, err => {
            if(!err) {
              callback(200);
            } else {
              callback(500,{'Error':'Could not update the data'});
            }
          });
        } else {
          callback(500,{'Error':'Could not read the data'});
        }
      });
    } else {
      callback(400,{'Error':'No data to update'});
    } 
  } else {
    callback(400,{'Error':'Missing required fields'});
  }     
};

handlers._users.delete = (data, callback) => {
  phone = data.payload.phone && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;

  if(phone) {
    _data.read('users', phone, (err, data) => {
      if(!err){
        _data.delete('users', phone, err => {
          if(!err){
            callback(200);
          } else {
            callback(500,{'Error':'Could not delete the user'});
          }
        });
      } else {
        callback(400,{'Error':'User not exists'});
      }
    });
  } else {
    callback(400,{'Error':'Missing required fields'});
  }
};

handlers.ping = (data, callback) => {
  callback(200);
};

handlers.notFound = (data, callback) => {
  callback(404);
},

module.exports = handlers;

