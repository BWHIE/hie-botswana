import logging
import socket

class MLLPClient:
    def __init__(self, host, port):
        self.host = host
        self.port = port

    def send_message(self, message):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            """Instead of  manually setting the IP each time, use the client's hostname"""
            
            logging.info(self.host)
            logging.info(self.port)
            sock.connect((self.host, self.port))
            sock.sendall(message.encode('UTF-8'))
            received = sock.recv(1024 * 1024)
            logging.info("Received response: %s", received.decode('UTF-8'))
            
        finally:
            sock.close()