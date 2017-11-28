
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
var MAX_SAVED_MESSAGES = 128;
var messages = [];

io.on('connection', function(socket) {

    socket.on('chat message', function(msg) {
        var messageData = {
            userdata: socket.userdata,
            id: socket.id,
            message: msg,
        };

        // Relay the message to all clients
        io.emit('chat message', messageData);

        // Remove old saved messages to make room for this one
        while (messages.length >= MAX_SAVED_MESSAGES) {
            messages.shift();
        }
        // Save the message
        messages.push(messageData);
    });

    socket.on('refresh messages', function() {
        socket.emit('previous messages', messages);
    });

    socket.on('login', function(userdata) {
        // Store the username in the socket session for this client
        socket.userdata = userdata;

        // Tell the client that it successfully logged in
        socket.emit('logged in', {
            userdata: socket.userdata
        });
        // Tell all clients that this client has joined
        socket.broadcast.emit('user joined', {
            userdata: socket.userdata
        });
    });

    socket.on('disconnect', function() {
        if (socket.userdata) {
            // Tell all clients that this client has left
            socket.broadcast.emit('user left', {
                userdata: socket.userdata
            });
        }
    });

    // Send the client the messages from before they connected
    socket.emit('previous messages', messages);

});
