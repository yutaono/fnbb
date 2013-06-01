
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    mongoose = require('mongoose');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
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

// Routes

app.get('/', routes.index);
var port = process.env.PORT || 3000;

app.listen(port, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});


// mongoose
var Schema = mongoose.Schema;
var UserSchema = new Schema({
  message: String,
  px: Number,
  py: Number,
  color_num: Number,
  visible: Boolean,
  created: Date
});
mongoose.model('User', UserSchema);
var uri = process.env.MONGOHQ_URL || 'mongodb://localhost/59bb'
mongoose.connect(uri);
var User = mongoose.model('User');

// Socket
var io = require('socket.io').listen(app);
io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
});

var looking_user = 0;

io.sockets.on('connection', function(socket){
  socket.on('msg update', function(){
    User.find({"visible":true}, function(err, docs){
      socket.emit('msg open', docs);
    });
  });

  console.log('conencted');
  looking_user++;
  socket.on('count looking user', function(){
    return looking_user;
  });

  socket.on('msg send', function(msg, px, py, color_num, created){
    socket.emit('msg push', msg, px, py, color_num, created);
    socket.broadcast.emit('msg push', msg, px, py, color_num, created);
    var user = new User();
    user.message = msg;
    user.px = px;
    user.py = py;
    user.color_num = color_num;
    user.visible = true;
    user.created = new Date();
    user.save(function(err) {
      if(err) { console.log(err); }
    });
  });

  socket.on('msg visible_false', function(px, py){
    User.update({"px":px, "py":py}, { $set:{"visible":false} }, false, true);
  });

  socket.on('deleteDB', function(){
    socket.emit('db drop');
    socket.broadcast.emit('db drop');
    User.find().remove();
  });

  socket.on('disconnect', function(){
    looking_user--;
    console.log('disconnected');
  });
});

