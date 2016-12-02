var validator = require("validator");

console.log(validator.isURL('facebook.com', {'require_protocol': true}));
console.log(validator.isURL('http://facebook.com'));
console.log(validator.isURL('http://www.facebook.com'));
console.log(validator.isURL('nodejs.love'));
console.log(validator.isURL('https://nodejs.love'));
//console.log(validator.isURL(''));