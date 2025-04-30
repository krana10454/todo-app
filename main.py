import os
import re
import random
import string
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
import smtplib
from email.mime.text import MIMEText
from mongo import MongoManager

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize MongoDB manager
mongo = MongoManager()

# Email configuration (move these to environment variables for security)
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587

# Ensure email environment variables are set
if None in [EMAIL_ADDRESS, EMAIL_PASSWORD]:
    raise ValueError("Email environment variables are missing.")

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

# Routes
@app.route('/')
def home():
    return render_template("index.html")

@app.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"error": "Email and password are required."}), 400
        if not email.endswith('@gmail.com'):
            return jsonify({"error": "Please use a Gmail address for registration."}), 400
        if not is_valid_password(password):
            return jsonify({"error": "Password requirements not met."}), 400
        if mongo.find_user_by_email(email):
            return jsonify({"error": "User already exists."}), 409

        hashed_password = generate_password_hash(password)
        result = mongo.insert_user(email, hashed_password)
        return jsonify({"message": "User registered successfully!"}), 201
    except Exception as e:
        print(f"Signup error: {e}")
        return jsonify({"error": "An error occurred during signup."}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        user = mongo.find_user_by_email(email)
        if not user or not check_password_hash(user['password'], password):
            return jsonify({"error": "Invalid email or password"}), 401

        # Return the user ID for client-side storage
        return jsonify({
            "message": "Login successful!",
            "userID": str(user['_id'])
        }), 200
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({"error": "An error occurred during login."}), 500

@app.route('/logout', methods=['POST'])
def logout():
    # In a stateless API like this, there's no server-side session to clear.
    # The client-side handles the UI changes after a successful "logout".
    return jsonify({"message": "Logged out successfully!"}), 200

@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        email = data.get('email')

        user = mongo.find_user_by_email(email)
        if not user:
            return jsonify({"error": "No user found with that email."}), 404

        temp_password = generate_temp_password()
        hashed_password = generate_password_hash(temp_password)
        mongo.update_user_password(email, hashed_password)

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

        send_email(email, subject, body)

        return jsonify({"message": "A temporary password has been sent to your email."}), 200
    except Exception as e:
        print(f"Forgot password error: {e}")
        return jsonify({"error": "An error occurred during the password reset process."}), 500

# Legacy endpoint - keep for compatibility but use with caution
@app.route('/tasks', methods=['GET'])
def get_tasks():
    try:
        # This is now deprecated - users should use the user-specific endpoint
        tasks = list(mongo.find_all_tasks())
        result = [{"id": str(task["_id"]), "task": task["task"], "completed": task["completed"]} for task in tasks]
        return jsonify(result), 200
    except Exception as e:
        print(f"Get tasks error: {e}")
        return jsonify({"error": "An error occurred while fetching tasks."}), 500

# New endpoint to get tasks by user ID
@app.route('/tasks/user/<user_id>', methods=['GET'])
def get_tasks_by_user_id(user_id):
    try:
        tasks = list(mongo.find_tasks_by_user_id(user_id))
        result = [{"id": str(task["_id"]), "task": task["task"], "completed": task["completed"]} for task in tasks]
        return jsonify(result), 200
    except Exception as e:
        print(f"Get tasks by user ID error: {e}")
        return jsonify({"error": "An error occurred while fetching tasks."}), 500

@app.route('/tasks', methods=['POST'])
def add_task():
    try:
        data = request.get_json()
        task_data = {
            "task": data['task'],
            "completed": False,
            "userID": data.get('userID')  # Associate task with user
        }

        print("Adding task data:", task_data)  # Debugging line
        if not task_data['task']:
            return jsonify({"error": "Task content is required."}), 400
        
        result = mongo.insert_task(task_data)
        print("Insert result:", result)  # Debugging line   
        task_data['id'] = str(result.inserted_id)  # Use 'id' key for consistency
        task_data.pop('_id', None)  # Remove the _id key if present
        print("Task data after insert:", task_data)  # Debugging line
        return jsonify({"message": "Task added successfully!", "task": task_data}), 201
    except Exception as e:
        print(f"Add task error: {e}")
        return jsonify({"error": "An error occurred while adding the task."}), 500
    
@app.route('/tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    try:
        data = request.get_json()
        update_fields = {}
        if 'task' in data:
            update_fields['task'] = data['task']
        if 'completed' in data:
            update_fields['completed'] = data['completed']

        result = mongo.update_task(task_id, update_fields)
        if result.matched_count == 0:
            return jsonify({"error": "Task not found"}), 404

        return jsonify({"message": "Task updated successfully!"}), 200
    except Exception as e:
        print(f"Update task error: {e}")
        return jsonify({"error": "An error occurred while updating the task."}), 500

@app.route('/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    try:
        result = mongo.delete_task(task_id)
        if result.deleted_count == 0:
            return jsonify({"error": "Task not found"}), 404

        return jsonify({"message": "Task deleted successfully!"}), 200
    except Exception as e:
        print(f"Delete task error: {e}")
        return jsonify({"error": "An error occurred while deleting the task."}), 500

if __name__ == '__main__':
    app.run(debug=True)