import json

class DataStore:
    def __init__(self, data_file="data.json"):
        self.data_file = data_file
        self._data = self._load_data()

    def _load_data(self):
        try:
            with open(self.data_file, "r") as f:
                return json.load(f)
        except FileNotFoundError:
            return {}  # Initialize with an empty dictionary if file not found

    def get(self, key, default=None):
        return self._data.get(key, default)

    def set(self, key, value):
        self._data[key] = value
        self._save_data()

    def _save_data(self):
        with open(self.data_file, "w") as f:
            json.dump(self._data, f)
