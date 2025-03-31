from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flasgger import Swagger

app = Flask(__name__)
Swagger(app)  # Initialize Swagger

# Configure SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///todo.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Define ToDo model
class ToDo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    task = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, default=False)

# Create database tables
with app.app_context():
    db.create_all()

# Home route
@app.route('/')
def home():
    """Welcome Endpoint
    ---
    responses:
      200:
        description: Returns a welcome message
    """
    return jsonify({"message": "Welcome to the ToDo App!"})

# ✅ GET all tasks
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
    return jsonify(task_list)

# ✅ POST - Add a new task
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
    return jsonify({"message": "Task added successfully!", "task": {"id": new_task.id, "task": new_task.task, "completed": new_task.completed}}), 201

# ✅ PATCH - Update a task
@app.route('/tasks/<int:task_id>', methods=['PATCH'])
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
    return jsonify({"message": "Task updated successfully!", "task": {"id": task.id, "task": task.task, "completed": task.completed}})

# ✅ DELETE - Remove a task
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
    return jsonify({"message": "Task deleted successfully!"})

if __name__ == '__main__':
    print('server is running at http://127.0.0.1:5000')
    print('documentation at http://127.0.0.1:5000/apidocs')
    app.run(debug=True)
