import os
import subprocess
import sys
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class ChangeHandler(FileSystemEventHandler):
    """Handler for restarting the server if a Python file changes."""
    def __init__(self, process):
        self.process = process

    def on_modified(self, event):
        if event.src_path.endswith('.py'):
            print(f"Detected change in {event.src_path}, restarting server...")
            self.restart_server()

    def restart_server(self):
        if self.process:
            self.process.terminate()  # Terminate the old process
            self.process.wait()       # Wait for the process to fully terminate
        # Start a new process
        self.process = subprocess.Popen([sys.executable, 'server.py'])

if __name__ == "__main__":
    path = os.path.dirname(os.path.abspath('server.py'))  # Path to watch
    initial_process = subprocess.Popen([sys.executable, 'server.py'])
    observer = Observer()
    event_handler = ChangeHandler(initial_process)
    observer.schedule(event_handler, path, recursive=True)
    observer.start()
    print("Watching for file changes in", path)

    try:
        while True:
            pass
    except KeyboardInterrupt:
        observer.stop()
        if initial_process:
            initial_process.terminate()
            initial_process.wait()
    observer.join()
    
