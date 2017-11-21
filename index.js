
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

io.on('connection', function(socket) {

  socket.on('chat message', function(msg) {
  	// Relay the message to all clients
    io.emit('chat message', {username: socket.username, message: msg});
  });

  socket.on('login', function(username) {
    // Store the username in the socket session for this client
    socket.username = username;
    socket.emit('logged in', {
      
    });
    // Tell all clients that this client has joined
    socket.broadcast.emit('user joined', {
      username: socket.username
    });
  });

  socket.on('disconnect', function () {
    if (socket.username) {
      // Tell all clients that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username
      });
    }
  });

});
