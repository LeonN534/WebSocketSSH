const WebSocketServer = require('ws').Server;
const net = require('net');

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function(ws) {
  let sshClient = new net.Socket();

  const connectSSH = () => {
    sshClient = new net.Socket();

    sshClient.on('error', function(err) {
      console.error('SSH Client Error:', err);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(`SSH Error: ${err.message}`);
      }
    });

    sshClient.connect(22, 'your_ssh_server_ip', function() {
      ws.on('message', function(message) {
        try {
          if (sshClient.writable) {
            sshClient.write('ls');
          }
        } catch (err) {
          console.error('Error writing to SSH:', err);
          ws.send(`Error writing to SSH: ${err.message}`);
        }
      });
    });

    sshClient.on('data', function(data) {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      } catch (err) {
        console.error('Error sending data:', err);
        ws.send(`Error sending data: ${err.message}`);
      }
    });

    sshClient.on('close', function() {
      // SSH connection closed; ready to connect again if needed
      ws.send('SSH Connection Closed');
    });
  };

  connectSSH();

  ws.on('close', function() {
    sshClient.end();
  });

  ws.on('error', function(err) {
    console.error('WebSocket Error:', err);
    // No need to send a message here since the WebSocket itself has errored
  });

  // Additional logic for reconnection or new SSH connection can be added here
});