const crypto = require('crypto');

const config = require('./config');

const helpers = {};

helpers.hash = str => {
  if (typeof str === 'string' && str.length > 0) {
    const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

helpers.parseJSONtoObject = json => {
  return json !== '' ? JSON.parse(json) : {};
};

helpers.createString = strLength => {
  const string = typeof strLength === 'number' && strLength > 0 ? true : false;

  if(string) {
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let str = '';

    for(i = 1; i <= strLength; i++) {
      const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
      str += randomCharacter; 
    }
    return str;
  } else {
    return false;
  }
};

module.exports = helpers;

