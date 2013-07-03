
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    // posts_handler = require('./routes/posts'),
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
// app.get('/posts', posts_handler.index);
var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});


// mongoose
var Schema = mongoose.Schema;
var PostSchema = new Schema({
  message: String,
  px: Number,
  py: Number,
  color_num: Number,
  created: Date
});
var oldPostSchema = new Schema({
  message: String,
  px: Number,
  py: Number,
  color_num: Number,
  created: Date
});
mongoose.model('Post', PostSchema);
mongoose.model('oldPost', oldPostSchema);
var uri = process.env.MONGOHQ_URL || 'mongodb://localhost/59bb'
console.log(uri);
mongoose.connect(uri);
var Post = mongoose.model('Post');
var oldPost = mongoose.model('oldPost');

// Socket
var io = require('socket.io').listen(app);

io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
});

var online_user = 0;

io.sockets.on('connection', function(socket){
  console.log('conencted');
  ++online_user;
  socket.emit('onlineNumber', { online_user: online_user});
  socket.broadcast.emit('onlineNumber', { online_user: online_user});

  socket.on('msg update', function(){
    // Post.find({"visible":true}, function(err, docs){
      // socket.emit('msg open', docs);
    // });
    Post.find(function(err, docs){
      socket.emit('msg open', docs);
    });
  });

  socket.on('msg send', function(msg, px, py, color_num, created){
    socket.emit('msg push', msg, px, py, color_num, created);
    socket.broadcast.emit('msg push', msg, px, py, color_num, created);

    var post = new Post();
    post.message = msg;
    post.px = px;
    post.py = py;
    post.color_num = color_num;
    post.created = new Date();
    post.save( function(err) {
      if(err) { console.log(err); }
    });

    var old_post = new oldPost();
    old_post.message = msg;
    old_post.px = px;
    old_post.py = py;
    old_post.color_num = color_num;
    old_post.created = new Date();
    old_post.save(function(err) {
      if(err) { console.log(err); }
    });
  });

  socket.on('msg visible_false', function(px, py){
    Post.find({"px":px, "py":py}).remove();
    socket.emit('msg delete', px, py);
    socket.broadcast.emit('msg delete', px, py);
  });

  socket.on('deleteDB', function(){
    socket.emit('db drop');
    socket.broadcast.emit('db drop');
    Post.find().remove();
  });

  socket.on('disconnect', function(){
    --online_user;
    socket.emit('onlineNumber', { online_user: online_user});
    socket.broadcast.emit('onlineNumber', { online_user: online_user});
    console.log('disconnected');
  });
});

