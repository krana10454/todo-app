# ToDo Application

## Overview
This is a simple ToDo application built using **Flask** and **SQLite**. It provides RESTful APIs to manage tasks, allowing users to create, update, retrieve, and delete tasks. The application also integrates **Swagger UI** for easy API documentation and testing.

## Features
- ✅ Add new tasks
- ✅ Get all tasks
- ✅ Update a task (mark as completed)
- ✅ Delete a task
- ✅ Interactive API documentation with **Swagger UI**

## Technologies Used
- **Flask** (Python web framework)
- **Flask-SQLAlchemy** (ORM for SQLite database)
- **Flasgger** (Swagger integration for API documentation)
- **SQLite** (Lightweight database for data storage)

## Installation & Setup
### 1️⃣ Clone the Repository
```sh
git clone https://github.com/yourusername/todo-app.git
cd todo-app
```

### 2️⃣ Install Dependencies
```sh
pip install -r requirements.txt
```

### 3️⃣ Run the Application
```sh
python app.py
```

### 4️⃣ Access the API
- API Base URL: `http://127.0.0.1:5000/`
- Swagger UI: `http://127.0.0.1:5000/apidocs/`

## API Endpoints
### 🏠 Home Route
- **`GET /`** - Returns a welcome message

### 📋 Task Management
- **`GET /tasks`** - Retrieve all tasks
- **`POST /tasks`** - Add a new task (JSON Body: `{ "task": "your task description" }`)
- **`PATCH /tasks/<task_id>`** - Update a task (JSON Body: `{ "completed": true }`)
- **`DELETE /tasks/<task_id>`** - Delete a task

## Database Setup
The application automatically creates an **SQLite database** (`todo.db`) on the first run. The database is managed using **SQLAlchemy**.

## Swagger API Documentation
This project includes **Swagger UI** for API testing.
- Visit `http://127.0.0.1:5000/apidocs/` to explore and test API endpoints interactively.

## Contributing
Feel free to contribute to this project by submitting pull requests. Ensure you follow best coding practices and test your code before submission.

## License
This project is licensed under the **MIT License**.

---
### 📩 Need Help?
If you have any questions, feel free to open an issue or reach out! 🚀

