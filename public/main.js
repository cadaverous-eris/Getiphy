$( document ).ready(function() {

	$(function () {

		var username = Math.random() + "_";

		var socket = io();

		$(this).data('username', username);

		login();

		$('form').submit(function(){
		  socket.emit('chat message', $('#m').val());
		  $('#m').val('');
		  return false;
		});

		socket.on('chat message', function(data) {
		  logMessage(data);
		});

		socket.on('user joined', function(data) {
		  $('#messages').append($('<li>').text(data.username + " has joined"));
		  $('#active-users').empty();
		  if (data.activeUsers) {
				for (var socketID in data.activeUsers) {
				  $('#active-users').append($('<li>').text(data.activeUsers[socketID]));
				}
		  }
		});

		socket.on('user left', function(data) {
		  $('#messages').append($('<li>').text(data.username + " has left"));
		  $('#active-users').empty();
		  if (data.activeUsers) {
				for (var socketID in data.activeUsers) {
				  $('#active-users').append($('<li>').text(data.activeUsers[socketID]));
				}
		  }
		});

		socket.on('logged in', function(data) {
		  $('#active-users').empty();
		  if (data.activeUsers) {
				for (var socketID in data.activeUsers) {
				  $('#active-users').append($('<li>').text(data.activeUsers[socketID]));
				}
		  }
		});

		function login() {
		  if (username) {
				socket.emit('login', username);
		  }
		}

		function logMessage(data) {
		  $('#messages').append($('<li>').text(data.username + ": " + data.message));
		}

  });

});