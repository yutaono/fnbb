$(function(){

	// var socket = io.connect('http://133.242.151.118:3000');
	// var socket = io.connect('http://www.snake4.mobi/fnbb/')
	// var socket = io.connect('http://fnbb.herokuapp.com/')
	// var socket = io.connect('http://localhost')
	// var socket = io.connect(window.location.hostname);
	// var socket = new io.Socket();
	// socket.connect();

	io.configure(function () {
	io.set("transports", ["xhr-polling"]);
	io.set("polling duration", 10);
	});
	socket = new io.Socket();

	socket.on('connect', function(){
		socket.emit('msg update');
	});

	var pos_x, pos_y;
	var textarea_click_flag = false;
	var pos_array = new Array();
	var color = new Array('red', 'darkblue', 'green', 'orange', 'purple', 'gray', 'black', 'darkblue', 'maroon', 'fuchsia');
	var max_fadeout_time = 59000; // 59sec

	$('#zone').click( function(e){
		var id = String(e.pageX) + '_' +String(e.pageY);
		var color_num = Math.floor(Math.random()*color.length);

		$(this).append("<input class='massage' id="+id+" value='' />");
		$('input#'+id).css("left",e.pageX).css("top",e.pageY).css("color", color[color_num]);

		$('input#'+id).focus().blur(function(){
			if($(this).val()!=''){
				socket.emit('msg send', $(this).val(), e.pageX, e.pageY, color_num);
			}
			$(this).remove();
		});

		$('input#'+id).keypress(function(e){
			var c = e.which ? e.which : e.keyCode;
			if(c==13){
				$(this).blur();
			}
		});

	});

	socket.on('msg push', function(msg, px, py, color_num, created){
		var id = String(px) + '_' +String(py);

		$('#zone').append("<span class='text' id='text_"+id+"''>"+msg+"</span>");
		$('span#text_'+id).css("left", px).css("top", py).css("color", color[color_num]);
		$('span#text_'+id).fadeOut(max_fadeout_time, function(){
			socket.emit('msg visible_false', px, py);
		});
		// }
	});

	socket.on('msg open', function(docs){
		if(docs.length == 0){
			return;
		} else {
			$.each(docs, function(key, value){
				var id = String(value.px) + '_' +String(value.py);
				var fadeout_time = max_fadeout_time - (new Date() - new Date(value.created));

				$('#zone').append("<span class='text' id='text_"+id+"''>"+value.message+"</span>");
				$('span#text_'+id).css("left", value.px).css("top", value.py).css("color", color[value.color_num]);
				$('span#text_'+id).css("opacity", fadeout_time/max_fadeout_time);

				if(fadeout_time < max_fadeout_time ){
					$('span#text_'+id).fadeOut(fadeout_time, function(){
						socket.emit('msg visible_false', value.px, value.py);
					});
				} else {
					socket.emit('msg visible_false', value.px, value.py);
				}
			});
		}
	});

	socket.on('msg update', function(msg){
		console.log(msg);
	});

});