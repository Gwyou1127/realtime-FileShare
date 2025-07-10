(function() {
    let senderID;
    const socket = io();

    function generateID() {
        return `${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}`;
    }

    // DOM이 로드된 후 실행되도록 수정
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelector("#receiver-start-con-btn").addEventListener("click", function() {
            senderID = document.querySelector("#join-id").value;
            if (senderID.length == 0) {
                return;
            }
            let joinID = generateID();
            socket.emit("receiver-join", {
                uid: joinID,
                sender_uid: senderID
            });
            document.querySelector(".join-screen").classList.remove("active");
            document.querySelector(".fs-screen").classList.add("active")
            document.querySelector(".home-icon").classList.add("hide-icon")
        });
    });

    let fileShare = {};

    socket.on("fs-meta", function(metadata) {
        console.log("Received file metadata:", metadata);
        fileShare.metadata = metadata;
        fileShare.transmitted = 0;
        fileShare.buffer = [];

        let el = document.createElement("div");
        el.classList.add("item");
        el.innerHTML = `
            <div class="progress">0%</div>
            <div class="filename">${metadata.filename}</div>
        `;
        document.querySelector(".files-list").appendChild(el);

        fileShare.progress_node = el.querySelector(".progress");

        socket.emit("fs-start", {
            uid: senderID
        });
    });

    socket.on("fs-share", function(buffer) {
        console.log("Received file chunk:", buffer.byteLength, "bytes");
        fileShare.buffer.push(buffer);
        fileShare.transmitted += buffer.byteLength;
        fileShare.progress_node.innerHTML = Math.trunc(fileShare.transmitted / fileShare.metadata.total_buffer_size * 100) + "%";
        if (fileShare.transmitted == fileShare.metadata.total_buffer_size) {
            console.log("File transfer complete, downloading:", fileShare.metadata.filename);
            // 수정: fileShare.meta -> fileShare.metadata
            download(new Blob(fileShare.buffer), fileShare.metadata.filename);
            fileShare = {};
        } else {
            socket.emit("fs-start", {
                uid: senderID
            });
        }
    })
})()