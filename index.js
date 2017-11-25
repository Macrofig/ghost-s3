'use strict';

// # S3 storage module for Ghost blog http://ghost.org/
var BaseAdapter = require('ghost-storage-base');
var fs = require('fs');
var path = require('path');
var nodefn = require('when/node/function');
var when = require('when');
var AWS = require('aws-sdk');

var readFile = nodefn.lift(fs.readFile);
var unlink = nodefn.lift(fs.unlink);
var MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

class S3Store extends BaseAdapter{
  constructor(options) {
    super();

    this.options = options;
    if (typeof options !== 'object') {
      throw new Error('ghost-s3 not properly configured!');
    }

    // TODO: Throw errors if missing any required properties
    this.s3 = new AWS.S3({
      accessKeyId: this.options.accessKeyId,
      secretAccessKey: this.options.secretAccessKey,
      bucket: this.options.bucket,
      region: this.options.region
    });
  }

  exists(fileName, targetDir) {
    var targetDir = targetDir || self.getTargetDir();
    var targetFilename = self.getTargetName(image, targetDir);
    var params = {
      Bucket: this.options.bucket,
      Key: path(targetDir, targetFilename)
    };
    return new Promise(function (resolve) {
      self.s3.headObject(params, function (err) {
        resolve(!err);
      });
    });
  }

  save(image, targetDir) {
    var self = this;

    var targetDir = targetDir || self.getTargetDir();
    var targetFilename = self.getTargetName(image, targetDir);
    var awsPath = this.options.assetHost ? this.options.assetHost : `https://${this.options.bucket}.s3.amazonaws.com/`;

    return readFile(image.path)
      .then(function(buffer) {
        return nodefn.call(self.s3.putObject.bind(self.s3), {
          ACL: 'public-read',
          Bucket: this.options.bucket,
          Key: targetFilename,
          Body: buffer,
          ContentType: image.type,
          CacheControl: 'max-age=' + (30 * 24 * 60 * 60) // 30 days
        });
      })
      .then(function(result) {
        self.logInfo('ghost-s3', 'Temp uploaded file path: ' + image.path);
      })
      .then(function() {
        return when.resolve(awsPath + targetFilename);
      })
      .catch(function(err) {
        self.logError(err);
        throw err;
      });
  }

  // middleware for serving the files
  serve() {
    // a no-op, these are absolute URLs
    return function (req, res, next) {
      next();
    };
  };

  getTargetDir() {
    var now = new Date();
    return path(now.getFullYear(), MONTHS[now.getMonth()]);
  }

  getTargetName(image, targetDir) {
    var ext = path.extname(image.name);
    var name = path.basename(image.name, ext).replace(/\W/g, '_');

    return targetDir + name + '-' + Date.now() + ext;
  }

  logError(error) {
    // TODO: Improve error handling
    console.log('error in ghost-s3', error);
  }

  logInfo(info) {
    // TODO: Improve logging
    console.log('info in ghost-s3', info);
  }
}

module.exports = MyCustomAdapter;
