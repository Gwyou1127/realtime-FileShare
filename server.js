const express = require("express");
const path = require("path");

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

app.use(express.static(path.join(__dirname+"/public")));

// 여기서부터 socket 이벤트 처리
io.on("connection", function(socket) {
    console.log("New client connected:", socket.id);
    
    // sender가 방에 참여
    socket.on("sender-join", function(data){
        console.log("Sender joined room:", data.uid);
        socket.join(data.uid);
    });
    
    // receiver가 방에 참여
    socket.on("receiver-join", function(data){
        console.log("Receiver joined room:", data.uid, "connecting to sender:", data.sender_uid);
        socket.join(data.uid);
        socket.in(data.sender_uid).emit("init", data.uid);
    });
    
    // 👇 여기에 파일 전송 관련 이벤트들을 추가
    // sender가 파일 메타데이터 전송
    socket.on('file-meta', (data) => {
        console.log("File metadata received:", data.metadata.filename);
        socket.in(data.uid).emit('fs-meta', data.metadata);
    });
    
    // sender가 파일 데이터 전송
    socket.on('file-raw', (data) => {
        console.log("File chunk received, size:", data.buffer.byteLength);
        socket.in(data.uid).emit('fs-share', data.buffer);
    });
    
    // receiver가 다음 청크 요청
    socket.on('fs-start', (data) => {
        console.log("Next chunk requested from:", data.uid);
        socket.in(data.uid).emit('fs-share');
    });
    
    socket.on("disconnect", function(){
        console.log("Client disconnected:", socket.id);
    });
    
}); // 👈 이 괄호 안에 모든 socket 이벤트가 들어가야 함

server.listen(5000, function(){
    console.log("Server running on port 5000");
});