#!/usr/bin/env node
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');
var couchdb = require('felix-couchdb');

var client = couchdb.createClient(5984, 'localhost');
var db = client.db('pastebin');

var app = module.exports = express.createServer();

var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});


app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.error(function(err, req, res, next) {
  console.log(err);
});
// Routes

app.get('/$', function (req, res) {
  res.render('index');
  res.end();
});

app.get('/paste/:id', function (req, res) {
  db.getDoc(req.params.id, function (err, data) {
    res.render('paste', { 
      'bin': data.body,
      'scripts':
        ['/javascripts/shCore.js', '/javascripts/shBrushPlain.js'],
      'styles':
        ['/stylesheets/shCore.css', '/stylesheets/shThemeDefault.css']
      });
  });
});
  
  
  //routes.index);
app.post('/', function (req, res) {
  var id_len = 8;
  var paste_id = '';
  var rchar;
  for (var i = 0; i < id_len; i += 1) {
    rchar = Math.floor(Math.random() * chars.length);
    paste_id += chars[rchar];
  }

  console.log(paste_id);
  db.saveDoc(paste_id, {
    date: new Date(),
    body: req.body.paste
  }, function(err, data) {
    if (err) {
      throw err;
    } else {
      res.header('Content-Type', 'text/plain');
      
      res.send('http://paste.totallymike.info/paste/' + paste_id + '\n', 201);
    }
  });
});

app.listen(6060);

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
