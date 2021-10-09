const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
    // TODO: Update to hosting address of frontend.
    cors: {
        origin: 'https://chatsy-65da0.web.app',
    }
});

// Data structure is, {socket, user}
var online = [];

io.use((socket, next) => {

    userRequest = socket.handshake.headers['userrequest'];

    console.log("user Request = " + userRequest)
    console.log("user Request typeof: " + userRequest)


    if (!(userRequest == "") && !(userRequest.replace(/\s/g, "") == "")) {

        if (online.find(x => x.user == userRequest)) {

            console.log(`Socket: ${socket.id}, Has attempted to reserve: ${userRequest}.`)

            // Will end socket connection attempt and pass error to client.
            next(new Error("Name not available."));
        } else {

            console.log(`${userRequest}, is available to client.`)

            // Assigning within socket object for further use.
            socket.user = userRequest;
            next();
        }

    } else {

        console.log("Format failed..")
        next(new Error("You cannot have that name. "));
    }

});

io.on('connection', (socket) => {

    online.push({ socket: socket.id, user: socket.user });

    console.log(`%cUser ${socket.user} has connected on socket ${socket.id}.`, "color:green");

    socket.join(socket.user);

    // Sharing online users for the client to chat with.
    io.emit('online', online.map(a => a.user));

    socket.on("message", ({ msg, to }) => {
        console.log(msg);
        console.log(to)

        // to receipient
        io.in(to).emit('message', { to: to, msg: msg, with: socket.user });

        //back to sender
        io.in(socket.user).emit('message', { to: to, msg: msg, with: to });

        // TODO: Make 'message' persistant after authentication implementation.
    });


    socket.on("disconnect", () => {
        console.log(`User ${socket.user} has disconnect on socket: ${socket.id}.`)

        // Remove user from online array.
        online = online.filter((a) => { return a.socket != socket.id });

        // Update clients with new array.
        io.emit('online', online.map(a => a.user));

    });

});



const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
    console.log(`Server is listening on port 3000`)
});