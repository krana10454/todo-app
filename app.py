import os
import re
import random
import string
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient
from bson import ObjectId
from urllib.parse import quote_plus
import smtplib
from email.mime.text import MIMEText

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Retrieve and encode MongoDB credentials
username = os.getenv("MONGO_USERNAME")
password = os.getenv("MONGO_PASSWORD")
host = os.getenv("MONGO_HOST")
dbname = os.getenv("MONGO_DBNAME")

# Email configuration (move these to environment variables for security)
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587

# Ensure all environment variables are set
if None in [username, password, host, dbname, EMAIL_ADDRESS, EMAIL_PASSWORD]:
    raise ValueError("One or more required environment variables are missing.")

# Encode the username and password
username = quote_plus(username)
password = quote_plus(password)

# Construct the MongoDB URI (corrected)
mongo_uri = f"mongodb+srv://{username}:{password}@{host}/{dbname}?retryWrites=true&w=majority"

# Connect to MongoDB
client = MongoClient(mongo_uri)
db = client[dbname]
users_collection = db['users']
tasks_collection = db['tasks']

# Utility functions (no changes needed)
def is_valid_password(password):
    if (len(password) < 8 or
        not re.search(r'[A-Z]', password) or
        not re.search(r'[0-9]', password) or
        not re.search(r'[@#$&*!]', password)):
        return False
    return True

def generate_temp_password(length=10):
    upper = random.choice(string.ascii_uppercase)
    digit = random.choice(string.digits)
    special = random.choice("@#$&*!")
    remaining = ''.join(random.choices(string.ascii_letters + string.digits, k=length - 3))
    temp_password = upper + digit + special + remaining
    return ''.join(random.sample(temp_password, len(temp_password)))

# Email sending function
def send_email(recipient_email, subject, body):
    try:
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = EMAIL_ADDRESS
        msg['To'] = recipient_email

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.sendmail(EMAIL_ADDRESS, recipient_email, msg.as_string())
        print(f"Email sent successfully to {recipient_email}")
    except Exception as e:
        print(f"Error sending email: {e}")

# Routes (only the /forgot-password route is updated)
@app.route('/')
def home():
    return render_template("index.html")

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400
    if not email.endswith('@gmail.com'):
        return jsonify({"error": "Please use a Gmail address for registration."}), 400
    if not is_valid_password(password):
        return jsonify({"error": "Password requirements not met."}), 400
    if users_collection.find_one({"email": email}):
        return jsonify({"error": "User already exists."}), 409

    hashed_password = generate_password_hash(password)
    users_collection.insert_one({"email": email, "password": hashed_password})
    return jsonify({"message": "User registered successfully!"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = users_collection.find_one({"email": email})
    if not user or not check_password_hash(user['password'], password):
        return jsonify({"error": "Invalid email or password"}), 401

    return jsonify({"message": "Login successful!"}), 200

@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')

    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"error": "No user found with that email."}), 404

    temp_password = generate_temp_password()
    hashed_password = generate_password_hash(temp_password)
    users_collection.update_one({"email": email}, {"$set": {"password": hashed_password}})

    subject = "Your Temporary Password"
    body = f"""
    Hello,

    You have requested a password reset for your ToDo App account. Your temporary password is:

    {temp_password}

    Please log in using this password and consider changing it to a new, strong password in your account settings after logging in.

    If you did not request this password reset, please ignore this email.

    Thank you,
    The ToDo App Team
    """

    # Send the email
    send_email(email, subject, body)

    return jsonify({"message": "A temporary password has been sent to your email."}), 200

@app.route('/tasks', methods=['GET'])
def get_tasks():
    tasks = list(tasks_collection.find())
    result = [{"id": str(task["_id"]), "task": task["task"], "completed": task["completed"]} for task in tasks]
    return jsonify(result), 200

@app.route('/tasks', methods=['POST'])
def add_task():
    data = request.get_json()
    task_data = {
        "task": data['task'],
        "completed": False
    }
    result = tasks_collection.insert_one(task_data)
    task_data['id'] = str(result.inserted_id)
    return jsonify({"message": "Task added successfully!", "task": task_data}), 201

@app.route('/tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.get_json()
    update_fields = {}
    if 'task' in data:
        update_fields['task'] = data['task']
    if 'completed' in data:
        update_fields['completed'] = data['completed']

    result = tasks_collection.update_one({"_id": ObjectId(task_id)}, {"$set": update_fields})
    if result.matched_count == 0:
        return jsonify({"error": "Task not found"}), 404

    return jsonify({"message": "Task updated successfully!"}), 200

@app.route('/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    result = tasks_collection.delete_one({"_id": ObjectId(task_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Task not found"}), 404

    return jsonify({"message": "Task deleted successfully!"}), 200

if __name__ == '__main__':
    app.run(debug=True)