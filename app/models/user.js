var db = require('../config');
var bcrypt = require('bcrypt');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  //hasTimestamps: true,
  initialize: function(){
    this.on('creating', function(model, attrs, options){
      console.log('creating a user');
      var password = model.get('password');
      bcrypt.genSalt(10, function(err, salt){
        model.set('salt', salt);
        bcrypt.hash(password, salt, function(err, hash) {
            // Store hash in your password DB.
            model.set('password', hash);
            model.save();
        });
      });
    });
  }
});

module.exports = User;