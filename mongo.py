import os
from urllib.parse import quote_plus
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

class MongoManager:
    def __init__(self):
        username = os.getenv("MONGO_USERNAME")
        password = os.getenv("MONGO_PASSWORD")
        host = os.getenv("MONGO_HOST")
        dbname = os.getenv("MONGO_DBNAME")

        if None in [username, password, host, dbname]:
            raise ValueError("One or more MongoDB environment variables are missing.")

        username = quote_plus(username)
        password = quote_plus(password)
        mongo_uri = f"mongodb+srv://{username}:{password}@{host}/{dbname}?retryWrites=true&w=majority"

        self.client = MongoClient(mongo_uri)
        self.db = self.client[dbname]
        self.users_collection = self.db['users']
        self.tasks_collection = self.db['tasks']

    def insert_user(self, email, hashed_password):
        return self.users_collection.insert_one({"email": email, "password": hashed_password})

    def find_user_by_email(self, email):
        return self.users_collection.find_one({"email": email})

    def update_user_password(self, email, hashed_password):
        return self.users_collection.update_one({"email": email}, {"$set": {"password": hashed_password}})

    def insert_task(self, task_data):
        return self.tasks_collection.insert_one(task_data)

    def find_all_tasks(self):
        return self.tasks_collection.find()
        
    def find_tasks_by_user_id(self, user_id):
        return self.tasks_collection.find({"userID": user_id})

    def update_task(self, task_id, update_fields):
        from bson import ObjectId
        return self.tasks_collection.update_one({"_id": ObjectId(task_id)}, {"$set": update_fields})

    def delete_task(self, task_id):
        from bson import ObjectId
        return self.tasks_collection.delete_one({"_id": ObjectId(task_id)})