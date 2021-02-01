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
            hashedPassword: hashedPassword,
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
  let { token } = data.headers;
  
  phone = phone.trim().length === 10 && typeof phone === 'string' ? phone : false;
  token = typeof token === 'string' && token.length === 20 ? token : false;

  handlers._tokens.verifyUser(token, phone, tokenIsValid => {
    if(tokenIsValid) {
      if (phone) {
        _data.read('users', phone, (err, data) => {
          if(!err) {
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          } 
        });
      } else {
        callback(400, {'Error': 'Missing required field'})
      }
    } else {
      callback(403, {'Error': 'Missing required token in headers is invalid, or token is expired'});
    }
  });
};

handlers._users.put = (data, callback) => {

  phone = data.payload.phone && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
  let { token } = data.headers;
  token = typeof token === 'string' && token.length === 20 ? token : false;

  if(phone) {

    let { firstName, lastName, password } = data.payload;

    firstName = firstName && firstName.trim().length > 0 ? firstName.trim() : false;
    lastName = lastName && lastName.trim().length > 0 ? lastName.trim() : false;
    password = password && password.trim().length > 0 ? password.trim() : false;

    if(firstName || lastName || password) {

      handlers._tokens.verifyUser(token, phone, tokenIsValid => {
        if(tokenIsValid) {
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
          callback(403, {'Error': 'Missing required token in headers is invalid, or token is expired'});
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
  let { token } = data.headers;
  token = typeof token === 'string' && token.length === 20 ? token : false;

  if(phone) {
    handlers._tokens.verifyUser(token, phone, tokenIsValid => {
      if(tokenIsValid) {
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
        callback(403, {'Error': 'Missing required token in headers is invalid, or token is expired'});
      }
    });
  } else {
    callback(400,{'Error':'Missing required fields'});
  }
};

handlers.tokens = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.includes(data.method)) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._tokens = {};

handlers._tokens.post = (data, callback) => {

  let { phone, password } = data.payload;

  phone = phone && phone.trim().length === 10 ? phone.trim() : false;
  password = password && password.trim().length > 0 ? password.trim() : false;

  if(phone && password) {
    _data.read('users', phone, (err, dataUser) => {
      if(!err){
        const hashedPassword = helpers.hash(password);
        if(dataUser.hashedPassword === hashedPassword) {

          const randomString = helpers.createString(20);
          const expires = Date.now() * 1000 * 60 * 60;

          const tokenObject = {
            id: randomString,
            expires: expires,
            phone: phone,
          };

          _data.create('tokens', randomString, tokenObject, err => {
            if(!err) {
              callback(200, tokenObject);
            } else {
              callback(500,{'Error': 'Could not store the data token'});
            }
          }); 
        } else {
          callback(500,{'Error': 'Error, password not match'});
        }
      } else {
        callback(500,{'Error':'Error could not read the user'});
      }
    });  
  } else {
    callback(400, {'Error':'Missing required fields'});
  }
};

handlers._tokens.get = (data, callback) => {
  const { id } = data.queryStringObject; 

  const idToken = typeof id === 'string' && id.trim().length === 20 ? id.trim() : false; 

  if(idToken) {
    _data.read('tokens', idToken, (err, data) => {
      if(!err && data) {
        callback(200, data);
      } else {
        callback(500,{'Error': 'Could not read data token'});
      }
    });  
  } else {
    callback(400, {'Error': 'Missing parameters required'});
  }

};

handlers._tokens.put = (data, callback) => {
  let { id, extend } = data.payload;

  const idUser = typeof id === 'string' && id.trim().length === 20 ? id.trim() : false; 
  const extendUser = typeof extend === 'boolean' && extend;

  if(idUser && extendUser) {
    _data.read('tokens', idUser, (err, tokenData) => {
      if(!err && data) {
        if(tokenData.expires > Date.now()) {
          tokenData.expires = Date.now() * 1000 * 60 * 60;
          _data.update('tokens', idUser, tokenData, err => {
            if(!err) {
              callback(200, tokenData);
            } else {
              callback(500, {'Error': 'Update cannot be stored'});
            }
          }); 
        } else {
          callback(500, {'Error': 'Token can not extend, token is expired'});
        }
      } else {
        callback(400,{'Error': 'Specified token does not exist'});
      }
    });
  } else {
    callback(400,{'Error': 'Missing parameters required'});
  }
};

handlers._tokens.delete = (data, callback) => {
  let { id } = data.queryStringObject;

  const token = typeof id === 'string' && id.trim().length === 20 ? id.trim() : false; 

  if(token) {
    _data.read('tokens', token, (err, data) => {
      if(!err && data) {
        _data.delete('tokens', token, err => {
          if(!err) {
            callback(200);
          } else {
            callback(500, {'Error': 'Can not be erase the token'});
          }
        });
      } else {
        callback(500, {'Error': 'Could not read the token'});
      }
    });
  } else {
    callback(500, {'Error': 'Missing parameters required'})
  }

};

handlers._tokens.verifyUser = (id, phone, callback) => {
  _data.read('tokens', id, (err, dataToken) => {
    if(!err && dataToken) {
      if(dataToken.phone === phone && dataToken.expires > Date.now()) {
        callback(true)
      } else {
        callback(false);
      }
    } else {
      callback(false);
    } 
  });
}; 

handlers.ping = (data, callback) => {
  callback(200);
};

handlers.notFound = (data, callback) => {
  callback(404);
},

module.exports = handlers;

