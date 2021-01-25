const fs = require('fs');
const path = require('path');
const {parseJSONtoObject} = require('./helpers');

const lib = {};

lib.baseDir = path.join(__dirname,'/../.data/');

lib.create = (dir, name, data, callback) => {
  fs.open(`${lib.baseDir}${dir}/${name}.json`, 'wx', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      const stringData = JSON.stringify(data);
      fs.write(fileDescriptor, stringData, err => {
        if(!err) {
          fs.close(fileDescriptor, err => {
            if (!err) {
              callback(false);
            } else {
              callback('Error when closing file');
            }
          });
        } else {
          callback('There was an error in file');
        }
      });
    } else {
      callback('Could not create folder, it may be exists');
    }
  });
};

lib.read = (dir, name, callback) => {
  fs.readFile(lib.baseDir+dir+'/'+name+'.json', 'utf8', (err, data) => {
    if (!err && data) {
      const parsedData = parseJSONtoObject(data);
      callback(false, parsedData);
    } else {
      callback(err, data)
    }
  });
};

lib.update = (dir, name, data, callback) => {
  fs.open(`${lib.baseDir}${dir}/${name}.json`, 'r+', (err, fileDescriptor) => {
    if (!err) {
      fs.truncate(fileDescriptor, err => {
        if (!err) {
          const stringData = JSON.stringify(data);
          fs.writeFile(fileDescriptor, stringData, err => {
            if (!err) {
              fs.close(fileDescriptor, err => {
                if (!err) {
                  callback(false);
                } else {
                  callback('There is an error closing the file');
                }
              });
            } else {
              callback('There is an error updating the file');
            }
          });
        } else {
          callback('There is an error openin the file');
        }
      });
    } else {
      callback('There was an error opening the file');
    } 
  });
};

lib.delete = (dir, name, callback) => {
  fs.unlink(`${lib.baseDir}${dir}/${name}.json`, err => {
    if (!err) {
      callback(false);
    } else {
      callback('There was an error deleting the file');
    }
  });
};

module.exports = lib;

