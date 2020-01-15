// ===============================================
// SERVER2SERVER SOCKET: helper functions
// ===============================================
export const disconnectSocket = (_socket) => {
  if (_socket) _socket.disconnect();
}

export const clearSendBufferSocket = (_socket) => { // clear emit-buffer (after offline-phase)
  if (_socket) _socket.sendBuffer = [];
}

export const emitWithTimeoutToSocket = (_socket, ioRoute, req, timeout) => {
  return new Promise( (resolve, reject) => {
    // check connection
    if (!_socket || !_socket.connected) {
      reject(new Error("no connection to server"));
    }
    // set timeout
    const timer = setTimeout(() => {
      clearTimeout(timer);
      this.clearSendBuffer(); // clear buffer to disable re-emit after reconnect
      reject(new Error("timeout for server call"));
    }, timeout || 5000);
    // call server
    try {
      _socket.emit(ioRoute, req, (err, res) => {
        clearTimeout(timer);
        if (err) reject(err);
        resolve(res);
      }); // of emit
    } catch (error) {
      reject(error);
    }
  }); // of promise
}
