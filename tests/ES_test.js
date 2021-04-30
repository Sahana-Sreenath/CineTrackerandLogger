var db = require('../data/db.js')
let mocha = require('mocha');
var MongoClient = require("mongodb").MongoClient;
let chai = require('chai');
let spies = require('chai-spies')
let chaiPromise = require('chai-as-promised')
let chaiHttp = require('chai-http');
let expect = chai.expect;
let api = require('../routers/apiRouter.js')
let server = require('../app.js')

chai.use(chaiHttp);
chai.use(spies);
chai.use(chaiPromise);
 
before(async function() {
  let startDB = await db.startdb(); 
});


console.log("Movie Title Entered by User");
console.log('should not bulkinput search if name is missing in ConfigES');
console.log("Data score map index generated");
console.log('content-type', 'text/html; charset=utf-8');
console.log('should get all the movie list sorted in elastic search according to data map score value');
console.log('should establish successful configuration with db for elastic search');
console.log('should not score based on the search indexed value');
console.log("movies indexed");
console.log('should post null if movie list matches null');
console.log("Movie does not exist based on the search");
                  