var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    email: {type: String, index: {unique: true}},
    lastname: String,
    firstname: String,
    creationDate: {type: Date, default: Date.now},
    passwordHash: String,
    isAdmin: {type: Boolean, default: false}
});

userSchema.virtual('name').get(function () {
    return this.firstname + ' ' + this.lastname;
});
userSchema.virtual('name').set(function (name) {
    var split = name.split(' ');
    this.firstname = split[0].trim();
    this.lastname = split[1].trim();
});

userSchema.statics.findById = function (id, cb) {
    return this.find({_id: id}, cb);
};

var User = mongoose.model('User', userSchema);

module.exports = User;