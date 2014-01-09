$(function() {	

	yourip = '';

	$.getJSON("http://jsonip.com?callback=?", function (data) {
	    yourip = data.ip;

		if ($.cookie('ipaddress') == yourip) {	
			close();
		} else {
			post_show();
		}
		$.cookie('ipaddress', yourip);
	});

	$(".close").click(function() {
		close();
	});

	setTimeout(function() {
		close();
	}, 7000);

});

function close() {	
	$(".note").hide();
	$(".screen-block").hide();
}

function post_show() {	
	$(".note").show();
	$(".screen-block").show();
}