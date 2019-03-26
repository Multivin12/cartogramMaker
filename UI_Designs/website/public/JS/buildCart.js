var socket = io();

socket.on('Error', (data) => {
	alert(data);
})
