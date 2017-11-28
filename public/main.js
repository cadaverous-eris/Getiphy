
var userdata;
var socket;

var messageAttachments = {
	gifs: [],
	videos: [],
};

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

	setInterval(function() {
		setMessagesHeight();
		offsetInput();
	}, 5000);

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

	function updateAttachmentInput() {
		$('.attachment-input').remove();
		if (messageAttachments && (messageAttachments.gifs.length > 0 || messageAttachments.videos.length > 0)) {
			var card = $('<div>').addClass('card attachment-input').css('margin-top', "10px");

			var header = $('<div>').addClass('card-header attachment-input-header').text("Attachments");
			var body = $('<div>').addClass('card-body attachment-input-body');

			if (messageAttachments.gifs.length > 0) {
				var gifRow = $('<div>').addClass('row justify-content-start')
				for (var i = 0; i < messageAttachments.gifs.length; i++) {
					var attachmentHolder = $('<div>').addClass('attachment-holder col-auto');
					attachmentHolder.append($('<img>').attr('src', messageAttachments.gifs[i]).addClass('attachment-preview'));
					attachmentHolder.append($('<span>').addClass('attachment-remove').attr('aria-hidden', "true").attr('data-index', i).html("&times;").on('click', function() {
						messageAttachments.gifs.splice($(this).attr('data-index'), 1);
						updateAttachmentInput();
					}));

					gifRow.append(attachmentHolder);
				}
				body.append(gifRow);
			}

			if (messageAttachments.videos.length > 0) {
				var vidRow = $('<div>').addClass('row justify-content-start')
				for (var i = 0; i < messageAttachments.videos.length; i++) {
					var attachmentHolder = $('<div>').addClass('attachment-holder col-auto');
					attachmentHolder.append($('<img>').attr('src', messageAttachments.videos[i].thumbnail).addClass('attachment-preview'));
					attachmentHolder.append($('<span>').addClass('attachment-remove').attr('aria-hidden', "true").attr('data-index', i).html("&times;").on('click', function() {
						messageAttachments.videos.splice($(this).attr('data-index'), 1);
						if ($(this).attr('aria-describedby')) {
							$('#' + $(this).attr('aria-describedby')).remove();
						}
						$('.tooltip').remove();
						updateAttachmentInput();
					}));

					attachmentHolder.attr({
						'data-toggle': "tooltip",
						'data-placement': "top",
						'title': messageAttachments.videos[i].title,
					});
					attachmentHolder.tooltip();

					vidRow.append(attachmentHolder);
				}
				body.append(vidRow);
			}

			card.append(header);
			card.append(body);

			$('#message-input').append(card);
		} else {

		}
		setMessagesHeight();
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
		if ($('#m').val().trim() && $('#m').val().trim().length > 0 || (messageAttachments && (messageAttachments.gifs.length > 0 || messageAttachments.videos.length > 0))) {
			if (userdata) {
				socket.emit('chat message', {
					text: $('#m').val().trim(),
					attachments: messageAttachments,
				});
				$('#m').val('');
				messageAttachments = {
					gifs: [],
					videos: [],
				};
				updateAttachmentInput();
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

	function urlify(text) {
    	var urlRegex = /\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig;
    	return text.replace(urlRegex, function(url) {
        	return '<a href="' + url + '" target="_blank">' + url + '</a>';
    	});
	}

	function logMessage(messageData) {
		if (messageData && messageData.userdata) {
			var message = $('<div>').addClass('row message');
			message.append($('<div>').addClass('col col-auto').append($('<img>').attr('src', messageData.userdata.image).addClass('profile-image')));
			var content = $('<div>').addClass('col');
			content.append($('<h4>').addClass('message-sender' + ((messageData.userdata && userdata && messageData.userdata.email === userdata.email) ? ' current-user' : '')).text(messageData.userdata.name));
			
			if (messageData.message.text && messageData.message.text.length) {
				content.append($('<hr>'));
				content.append($('<p>').addClass('message-body').html(urlify(messageData.message.text)));
			}

			if (messageData.message.attachments && (messageData.message.attachments.gifs.length > 0 || messageData.message.attachments.videos.length > 0)) {
				content.append($('<hr>'));
				if (messageData.message.attachments.gifs.length > 0) {
					var gifAttachments = $('<div>').addClass('row justify-content-start attachment-row');
					for (var i = 0; i < messageData.message.attachments.gifs.length; i++) {
						gifAttachments.append($('<img>').attr('src', messageData.message.attachments.gifs[i]).addClass('gif-attachment'));
					}
					content.append(gifAttachments);
				}
				if (messageData.message.attachments.videos.length > 0) {
					var videoAttachments = $('<div>').addClass('row justify-content-start attachment-row');
					for (var i = 0; i < messageData.message.attachments.videos.length; i++) {
						videoAttachments.append($('<iframe>').attr('width', "384").attr('height', "216").attr('src', "//www.youtube.com/embed/" + messageData.message.attachments.videos[i].videoId).attr('frameborder', "0").attr('allowfullscreen', 'true').addClass('video-attachment'));
					}
					content.append(videoAttachments);
				}
			}

			message.append(content);

			$('#messages').append(message);
		}
	}

	const GIPHY_KEY = 'bEOeuErhPvzkghlGxQahBs86Pn9Gt1I9';
	const GIPHY_LIMIT = 20;

	$('#giphy-search-button').on('click', function() {
		updateGiphyResults($('#giphy-search').val().trim());
	});

	$('#giphy-search').on('keyup', function(event) {
		var keycode = event.keyCode ? event.keyCode : event.which;
		if (keycode == '13') {
			updateGiphyResults($('#giphy-search').val().trim());
		}
	});

	var giphyRequest;

	function updateGiphyResults(query) {
		if (query && query.length > 0) {
			$('#giphy-results').empty();
			$('#giphy-search').val('');
			var queryURL = "https://api.giphy.com/v1/gifs/search?q=" + query + "&api_key=" + GIPHY_KEY + "&limit=" + GIPHY_LIMIT + "&rating=PG";

			if (giphyRequest && giphyRequest.readyState != 4) {
            	giphyRequest.abort();
        	}	

			giphyRequest = $.ajax({
            	url: queryURL,
            	method: 'GET'
        	});
        	giphyRequest.done(function(response) {
            	if (response && response.data && response.data.length > 0) {
            		for (var i = 0; i < response.data.length; i++) {
            			var gifCol = $('<div>').addClass('col col-auto giphy-result-holder');
            			var gif = $('<img>').attr('src', response.data[i].images.fixed_height.url).attr('data-selected', "false").addClass('giphy-result-gif');

            			gif.on('click', function() {
            				if ($(this).attr('data-selected') === "true") {
            					$(this).attr('data-selected', "false");

            				} else {
            					$(this).attr('data-selected', "true");
            				}
            			});

            			gifCol.append(gif);
            			$('#giphy-results').append(gifCol);
            		}
            	}
        	});
		}
	}

	YOUTUBE_KEY = 'AIzaSyAHIgCoXviJVoJzzxCKQgbyDIcwmDaymyI';
	YOUTUBE_LIMIT = 20;

	$('#youtube-search-button').on('click', function() {
		updateYoutubeResults($('#youtube-search').val().trim());
	});

	$('#youtube-search').on('keyup', function(event) {
		var keycode = event.keyCode ? event.keyCode : event.which;
		if (keycode == '13') {
			updateYoutubeResults($('#youtube-search').val().trim());
		}
	});

	var youtubeRequest;

	function updateYoutubeResults(query) {
		if (query && query.length > 0) {
			$('#youtube-results').empty();
			$('#youtube-search').val('');
			var queryURL = "https://content.googleapis.com/youtube/v3/search?maxResults=" + YOUTUBE_LIMIT + "&part=snippet&q=" + query + "&type=video&videoEmbeddable=true&videoSyndicated=true&key=" + YOUTUBE_KEY;

			if (youtubeRequest && youtubeRequest.readyState != 4) {
				youtubeRequest.abort();
			}

			youtubeRequest = $.ajax({
            	url: queryURL,
            	method: 'GET'
        	});
        	youtubeRequest.done(function(response) {
        		//console.log(response);
        		if (response && response.items) {
        			var col = $('<div>').addClass('col');
        			$('#youtube-results').append(col);

	        		for (var i = 0; i < response.items.length; i++) {
	            		var videoId = response.items[i].id.videoId;
	            		var thumbnail = response.items[i].snippet.thumbnails.default.url;
	            		var title = response.items[i].snippet.title;
	            		var channel = response.items[i].snippet.channelTitle;

	            		var result = $('<div>').addClass('row youtube-result-holder')
	            				.attr('data-thumbnail', thumbnail)
	            				.attr('data-videoId', videoId)
	            				.attr('data-title', title)
	            				.attr('data-channel', channel);
	            		result.attr('data-selected', "false");

	            		result.on('click', function() {
	            			if ($(this).attr('data-selected') === "true") {
            					$(this).attr('data-selected', "false");

            				} else {
            					$(this).attr('data-selected', "true");
            				}
	            		});

	            		result.append($('<div>').addClass('col col-auto').append($('<img>').attr('src', thumbnail).addClass('youtube-result-thumbnail')));
	            		var dataCol = $('<div>').addClass('col youtube-result-data');
	            		dataCol.append($('<h5>').text(title).addClass('youtube-result-title'));
	            		dataCol.append($('<hr>'));
	            		dataCol.append($('<span>').text(channel).addClass('youtube-result-channel'));
	            		result.append(dataCol);

	            		col.append(result);
			        }
			    }
        	});
		}
	}

	$('#add-attachments-button').on('click', function() {
		var currentTab = $('#nav-tabContent .active');
		if (currentTab) {
			switch (currentTab.attr('id')) {
				case 'nav-giphy':
					var selectedItems = $(".giphy-result-gif[data-selected='true']");
					if (selectedItems.length + messageAttachments.gifs.length > 3) {
						alert("You cannot attach more than 3 gifs");
					} else {
						for (var i = 0; i < selectedItems.length; i++) {
							let gifSrc = $(selectedItems[i]).attr('src');
							if (!messageAttachments.gifs.includes(gifSrc)) {
								messageAttachments.gifs.push(gifSrc);
							}
						}
						updateAttachmentInput();
						$('#giphy-search').val('');
						$('#giphy-results').empty();
						$('#attachment-modal').modal('hide');
					}
				break;
				case 'nav-youtube':
					var selectedItems = $(".youtube-result-holder[data-selected='true']");
					if (selectedItems.length + messageAttachments.videos.length > 2) {
						alert("You cannot attach more than 2 videos");
					} else {
						for (var i = 0; i < selectedItems.length; i++) {
							var video = {
								videoId: $(selectedItems[i]).attr('data-videoId'),
								thumbnail: $(selectedItems[i]).attr('data-thumbnail'),
								title: $(selectedItems[i]).attr('data-title'),
								channel: $(selectedItems[i]).attr('data-channel'),
							};
							var contains = false;
							for (var j = 0; j < messageAttachments.videos.length; j++) {
								if (messageAttachments.videos[j].videoId === video.videoId) {
									contains = true;
									break;
								}
							}
							if (!contains) {
								messageAttachments.videos.push(video);
							}
						}
						updateAttachmentInput();
						$('#youtube-search').val('');
						$('#youtube-results').empty();
						$('#attachment-modal').modal('hide');
					}
				break;
			}
		}
	});

});
