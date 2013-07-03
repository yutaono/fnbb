$(function(){

	var socket = io.connect(window.location.hostname);

	socket.on('connect', function(){
		socket.emit('msg update');
	});

	var pos_x, pos_y;
	var textarea_click_flag = false;
	var pos_array = new Array();
	var color = new Array('red', 'darkblue', 'green', 'orange', 'purple', 'gray', 'black', 'darkblue', 'maroon', 'fuchsia');
	var max_fadeout_time = 59000; // 59sec

	$('span#description').fadeOut(max_fadeout_time);

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

	socket.on('onlineNumber', function(data){
		var resData = data.online_user;
		$('span#online span').html(resData);
	});

	socket.on('msg push', function(msg, px, py, color_num, created){
		var id = String(px) + '_' +String(py);
		var text_id = 'span#text_' + id;

		if($(msg).text().length!=0){
			msg = $(msg).text();
		}

		$('#zone').append("<span class='text' id='text_"+id+"''>"+ msg +"</span>");
		$(text_id).css("left", px).css("top", py).css("color", color[color_num]);
		$(text_id).fadeOut(max_fadeout_time, function(){
			socket.emit('msg visible_false', px, py);
		});
	});

	socket.on('msg open', function(docs){
		if(docs.length == 0){
			return;
		} else {
			$.each(docs, function(key, value){
				var id = String(value.px) + '_' +String(value.py);
				var text_id = 'span#text_' + id;
				var fadeout_time = max_fadeout_time - (new Date() - new Date(value.created));

				if($(value.message).text().length!=0){
					value.message = $(value.message).text();
				}

				$('#zone').append("<span class='text' id='text_"+id+"'>"+ value.message +"</span>");
				$(text_id).css("left", value.px).css("top", value.py).css("color", color[value.color_num]);
				$(text_id).css("opacity", fadeout_time/max_fadeout_time);
				$(text_id).css("display", "none");
				$(text_id).fadeIn("slow");

				if(fadeout_time < max_fadeout_time ){
					$(text_id).fadeOut(fadeout_time, function(){
						socket.emit('msg visible_false', value.px, value.py);
					});
				} else {
					socket.emit('msg visible_false', value.px, value.py);
				}
			});
		}
	});

	socket.on('msg delete', function(px, py){
		var id = String(px) + '_' +String(py);
		var text_id = 'span#text_' + id;
		$(text_id).remove();
	});

	socket.on('msg update', function(msg){
		console.log(msg);
	});



});