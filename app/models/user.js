var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  // tableName: 'users',
  // initialize: function(){
  //   this.on('creating', function(model, attrs, options){
  //     var password = model.get('password');

  //     bcrypt.genSalt(20, function(err, salt){
  //       model.set('salt', salt);
  //       bcrypt.hash(password, salt, null, function(err, hash) {
  //           // Store hash in your password DB.
  //           model.set('password', hash);
  //       });
  //     });
  //   });
  // }
});

module.exports = User;