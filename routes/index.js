
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: '59sec white board' })
};

exports.posts = function(req, res){
  res.render('posts', { title: '59sec white board 2' })
};