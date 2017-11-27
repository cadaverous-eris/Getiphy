
var userdata;

var socket;

function login(googleUser) {
	var profile = googleUser.getBasicProfile();
	userdata = {
		name: profile.getName(),
		image: profile.getImageUrl(),
		email: profile.getEmail()
	};
	$(this).data('userdata', userdata);
	if (userdata && socket) {
		socket.emit('login', userdata);
	}
	$('.sign-out-button').remove();
	$('#login-area').append(
		$('<button>').addClass("btn btn-primary btn-sm my-2 my-sm-0 sign-out-button").attr('href', "#").text("Sign Out")
	);
	$('.g-signin2').prop('disabled', true).hide();
	refreshMessages();
}

function logoff() {
	var auth2 = gapi.auth2.getAuthInstance();
	auth2.signOut().then(function () {
		auth2.disconnect();
		$('.sign-out-button').remove();
		userdata = undefined;
		$(this).data('userdata', userdata);
		$('.g-signin2').prop('disabled', false).show();
		refreshMessages();
	});
}

function refreshMessages() {
	if (socket) {
		socket.emit('refresh messages');
	}
}

$(document).ready(function() {

	$(window).on('resize', function() {
		setMessagesHeight();
		offsetInput();
	});

	$(document).on('click', '.sign-out-button', function() {
		logoff();
	});

	function setMessagesHeight() {
		var extra = $('#messages').outerHeight(true) - $('#messages').height();
		var messagesHeight = $(window).outerHeight(true) - $('#navbar').outerHeight(true) - $('#input').outerHeight(true) - extra;
		$('#messages').height(Math.max(messagesHeight, 100));
	}

	function offsetInput() {
		var scrollBarWidth = $('#messages').outerWidth() - $('#messages').prop('scrollWidth');
		var paddingLeft = $('#input').css('padding');
		paddingLeft = parseInt(paddingLeft.substring(0, paddingLeft.length - 2));
		$('#input').css('padding-right', (paddingLeft + scrollBarWidth) + "px");
	}

	function scrollToNewestMessage() {
		$('#messages').scrollTop($('#messages').prop('scrollHeight') - $('#messages').height());
	}

	setMessagesHeight();
	offsetInput();
	if (userdata) {
		$('#login-area').append(
			$('<button>').addClass("btn btn-primary btn-sm my-2 my-sm-0 sign-out-button").attr('href', "#").text("Sign Out")
		);
		$('.g-signin2').prop('disabled', true).hide();
	}

	socket = io();

	$(this).data('userdata', userdata);

	socket.emit('connect', userdata);

	function sendMessage() {
		if ($('#m').val().trim() && $('#m').val().trim().length > 0) {
			if (userdata) {
				socket.emit('chat message', $('#m').val().trim());
				$('#m').val('');
			} else {
				alert("You must log in in order to send messages!");
			}
		}
		return false;
	}

	$('#send-button').on('click', function() {
		sendMessage();
	});

	$('#m').on('keyup', function(event) {
		var keycode = event.keyCode ? event.keyCode : event.which;
		if (keycode == '13') {
			sendMessage();
		}
	});

	socket.on('chat message', function(messageData) {
		logMessage(messageData);
		$('#messages').scrollTop($('#messages').prop('scrollHeight') - $('#messages').height());
	});

	socket.on('user joined', function(data) {
		
	});

	socket.on('user left', function(data) {
		
	});

	socket.on('logged in', function(data) {
		
	});

	socket.on('previous messages', function(messages) {
		$('#messages').empty();
		if (messages) {
			for (var i = 0; i < messages.length; i++) {
				logMessage(messages[i]);
			}
		}
		$('#messages').scrollTop($('#messages').prop('scrollHeight') - $('#messages').height());
	});

	function logMessage(messageData) {
		var message = $('<div>').addClass('row message');
		message.append($('<div>').addClass('col col-auto').append($('<img>').attr('src', messageData.userdata.image).addClass('profile-image')));
		var content = $('<div>').addClass('col');
		content.append($('<h4>').addClass('message-sender' + ((messageData.userdata && userdata && messageData.userdata.email === userdata.email) ? ' current-user' : '')).text(messageData.userdata.name));
		content.append($('<hr>'));
		content.append($('<p>').addClass('message-body').text(messageData.message));
		message.append(content);

		$('#messages').append(message);
	}

	const PUBLIC_KEY = 'dc6zaTOxFJmzC';
	const BASE_URL = '//api.giphy.com/v1/gifs/';
	const ENDPOINT = 'search';
	const LIMIT = 4;
	const RATING = 'pg';

	let $queryInput = $('.query');
	let $resultWrapper = $('.result');
	let $loader = $('.loader');
	let $inputWrapper = $('.input-wrapper');
	let $clear = $('.clear');
	let $button = $('.random');
	let currentTimeout;

	let query = {
		text: null,
		offset: 0,
		request() {
			return `${BASE_URL}${ENDPOINT}?q=${this.text}&limit=${LIMIT}&rating=${RATING}&offset=${this.offset}&api_key=${PUBLIC_KEY}`;
		},
		fetch(callback) {
			$.getJSON(this.request())
			.success(data => {
				let results = data.data;

				if (results.length) {
					let url = results[0].images.downsized.url;
					console.log(results);
					callback(url);
				} else {
			  		callback('');
				}
			})
			.fail(error => {
				console.log(error);
			});
		}
	}

	function buildImg(src = '//giphy.com/embed/xv3WUrBxWkUPC', classes = 'gif hidden') {
		return `<img src="${src}" class="${classes}" alt="gif" />`;
	}

	$clear.on('click', e => {
		$queryInput.val('');
		$inputWrapper.removeClass('active').addClass('empty');
		$('.gif').addClass('hidden');
		$loader.removeClass('done');
		$button.removeClass('active');
	});

	$button.on('click', e => {
		query.offset = Math.floor(Math.random() * 25);

		query.fetch(url => {
			if (url.length) {
				$resultWrapper.html(buildImg(url));

				$button.addClass('active');
			} else {
				$resultWrapper.html(`<p class="no-results hidden">No Results found for <strong>${query.text}</strong></p>`);

				$button.removeClass('active');
			}

			$loader.addClass('done');
			currentTimeout = setTimeout(() => {
				$('.hidden').toggleClass('hidden');
			}, 1000);
		});
	});

	$queryInput.on('keyup', e => {
		let key = e.which || e.keyCode;
		query.text = $queryInput.val();
		query.offset = Math.floor(Math.random() * 25);

		if (currentTimeout) {
			clearTimeout(currentTimeout);
			$loader.removeClass('done');
		}

		currentTimeout = setTimeout(() => {
			currentTimeout = null;
			$('.gif').addClass('hidden');

			if (query.text && query.text.length) {
				$inputWrapper.addClass('active').removeClass('empty');

				query.fetch(url => {
					if (url.length) {
						$resultWrapper.html(buildImg(url));

						$button.addClass('active');
					} else {
						$resultWrapper.html(`<p class="no-results hidden">No Results found for <strong>${query.text}</strong></p>`);

						$button.removeClass('active');
					}

					$loader.addClass('done');
					currentTimeout = setTimeout(() => {
						$('.hidden').toggleClass('hidden');
					}, 100);
				});
			} else {
				$inputWrapper.removeClass('active').addClass('empty');
				$button.removeClass('active');
			}
		}, 1000);
	});

});