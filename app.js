#!/usr/bin/env node
/**
 * Module dependencies.
 */

var fs      = require('fs');
var express = require('express'),
    routes = require('./routes');
var couchdb = require('felix-couchdb');

var config = {};
config = JSON.parse(fs.readFileSync(process.env.HOME + '/.pasterc'));

var client = couchdb.createClient(config.couchPort, config.couchAddress);
var db = client.db(config.dbName);

var app = module.exports = express.createServer();

var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
// Configuration

process.env.IRC_NODE_PATH = process.env.HOME + '/pastebin/ircnode';
process.env.IRC_NODE_DEBUG = false;

var irc = require('ircnode');

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

var brushScripts = {
  'plain'   : 'shBrushPlain.js',
  'js'      : 'shBrushJScript.js',
  'c'       : 'shBrushCpp.js',
  'cpp'     : 'shBrushCpp.js',
  'java'    : 'shBrushJava.js',
  'pl'      : 'shBrushPerl.js',
  'perl'    : 'shBrushPerl.js',
  'html'    : 'shBrushXml.js',
  'xml'     : 'shBrushXml.js',
  'xhtml'   : 'shBrushXml.js'
};


app.get('/', function (req, res, next) {
  if (req.param('p')) {
    var brush = (typeof brushScripts[req.param('lang')] !== 'undefined') ? req.param('lang') : 'plain';
    var scripts = ['/javascripts/shCore.js', '/javascripts/' + brush];
    db.getDoc(req.param('p'), function (err, data) {
      if (err) {
        res.render('paste_error', { error: err });
      } else {
        res.render('paste', { 
          'bin': data.body,
          'scripts':
            ['/javascripts/shCore.js', '/javascripts/' + brushScripts[brush]],
          'brush':
            brush,
          'styles':
            ['/stylesheets/shCore.css', '/stylesheets/shThemeDefault.css']
        });
      }
    });
  } else {
    next();
  }
});
  
app.get('/$', function (req, res) {
  res.render('index');
  res.end();
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
      var addr = 'http://paste.totallymike.info/?p=' + paste_id;

      res.header('Content-Type', 'text/plain');
      res.send(addr + '\n', 201);

      irc.privmsg(irc.config.chan, 'New pastebin: ' + addr);
    }
  });
});

app.listen(6060);

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
