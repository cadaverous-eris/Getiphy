
var express = require('express');
var http = require('http');
var socketIO = require('socket.io');
var path = require('path');
var bodyParser = require('body-parser');

// Create the express app, the http server, and socket.io server
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Handle routing automagically using express and the 'path' dependency
app.use(express.static(path.join(__dirname, 'public')));

// Start server on predefined port
server.listen(PORT, function() {
  console.log('listening on *:' + PORT);
});

// The actual chatroom
var activeUsers = {
	
};

io.on('connection', function(socket) {

  socket.on('chat message', function(msg) {
  	// Relay the message to all clients
    io.emit('chat message', {
    	username: socket.username,
    	id: socket.id,
    	message: msg
    });
  });

  socket.on('login', function(username) {
    // Store the username in the socket session for this client
    socket.username = username;
    activeUsers[socket.id] = username;
    socket.emit('logged in', {
      username: socket.username,
      activeUsers: activeUsers
    });
    // Tell all clients that this client has joined
    socket.broadcast.emit('user joined', {
      username: socket.username,
      activeUsers: activeUsers
    });
  });

  socket.on('disconnect', function () {
  	activeUsers[socket.id] = undefined;
    if (socket.username) {
      // Tell all clients that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
      	activeUsers: activeUsers
      });
    }
  });

});
