from flask import Flask, jsonify, request, render_template, url_for
from flask_sqlalchemy import SQLAlchemy
from flasgger import Swagger
from flask_cors import CORS  # Allow cross-origin requests (optional)
import os

app = Flask(__name__)
CORS(app)  # Enable CORS (optional, only if frontend & backend are separate origins)
Swagger(app)  # Initialize Swagger for API documentation

# ✅ Configure SQLite database (with absolute path)
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(BASE_DIR, "todo.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ✅ Define ToDo model
class ToDo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    task = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, default=False)

# ✅ Create database tables if they don't exist
with app.app_context():
    db.create_all()

# ✅ Serve the frontend page
@app.route('/')
def home():
    """Render the frontend"""
    return render_template("index.html")

# ✅ GET all tasks (API)
@app.route('/tasks', methods=['GET'])
def get_tasks():
    """Get All Tasks
    ---
    responses:
      200:
        description: Returns a list of all tasks
    """
    tasks = ToDo.query.all()
    task_list = [{"id": task.id, "task": task.task, "completed": task.completed} for task in tasks]
    return jsonify(task_list), 200

# ✅ POST - Add a new task (API)
@app.route('/tasks', methods=['POST'])
def add_task():
    """Add a New Task
    ---
    parameters:
      - name: task
        in: body
        required: true
        schema:
          type: object
          properties:
            task:
              type: string
    responses:
      201:
        description: Task added successfully
      400:
        description: Task description is required
    """
    data = request.get_json()
    if not data or 'task' not in data:
        return jsonify({"error": "Task description is required!"}), 400

    new_task = ToDo(task=data['task'])
    db.session.add(new_task)
    db.session.commit()

    return jsonify({
        "message": "Task added successfully!",
        "task": {"id": new_task.id, "task": new_task.task, "completed": new_task.completed}
    }), 201

# ✅ PUT - Update a task (API)
@app.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update a Task
    ---
    parameters:
      - name: task_id
        in: path
        required: true
        type: integer
      - name: completed
        in: body
        required: true
        schema:
          type: object
          properties:
            completed:
              type: boolean
    responses:
      200:
        description: Task updated successfully
      404:
        description: Task not found
    """
    task = ToDo.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    data = request.get_json()
    task.completed = data.get('completed', task.completed)
    db.session.commit()

    return jsonify({
        "message": "Task updated successfully!",
        "task": {"id": task.id, "task": task.task, "completed": task.completed}
    }), 200

# ✅ DELETE - Remove a task (API)
@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a Task
    ---
    parameters:
      - name: task_id
        in: path
        required: true
        type: integer
    responses:
      200:
        description: Task deleted successfully
      404:
        description: Task not found
    """
    task = ToDo.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted successfully!"}), 200

# ✅ Run Flask app
if __name__ == '__main__':
    print("🚀 Server is running at: http://127.0.0.1:5000")
    print("📄 API Documentation: http://127.0.0.1:5000/apidocs")
    print("📌 Available Routes:")
    print("   ➤ /           (Frontend)")
    print("   ➤ /tasks      (GET all tasks)")
    print("   ➤ /tasks      (POST new task)")
    print("   ➤ /tasks/<id> (PUT update task)")
    print("   ➤ /tasks/<id> (DELETE task)")
    app.run(debug=True)
