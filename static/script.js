document.addEventListener("DOMContentLoaded", function () {
    const taskInput = document.getElementById("taskInput");
    const taskList = document.getElementById("taskList");
    const addTaskButton = document.getElementById("addTaskBtn");
    const darkModeToggle = document.getElementById("toggleDarkMode");
    const themeSelect = document.getElementById("themeSelect");
    const filterSelect = document.getElementById("filterSelect");

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
        applyTheme(savedTheme);
        themeSelect.value = savedTheme;
    }

    if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark-mode");
        darkModeToggle.checked = true;
    }

    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === "") {
            alert("⚠️ Please enter a task!");
            return;
        }

        fetch("/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ task: taskText })
        })
        .then(response => response.json())
        .then(data => {
            if (data.task) {
                addTaskToUI(data.task);
                taskInput.value = "";
            }
        });
    }

    function fetchTasks() {
        fetch("/tasks")
            .then(response => response.json())
            .then(tasks => {
                const filter = filterSelect.value;

                const filteredTasks = tasks.filter(task => {
                    if (filter === "completed") return task.completed;
                    if (filter === "pending") return !task.completed;
                    return true;
                });

                taskList.innerHTML = "";
                filteredTasks.forEach(addTaskToUI);
            });
    }

    function addTaskToUI(task) {
        const li = document.createElement("li");
        li.dataset.id = task.id;
        if (task.completed) li.classList.add("completed");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.addEventListener("change", () => {
            toggleComplete(task.id, checkbox.checked);
        });

        const span = document.createElement("span");
        span.textContent = task.task;
        span.style.flexGrow = "1";

        const editBtn = document.createElement("button");
        editBtn.textContent = "✏️";
        editBtn.classList.add("edit");

        let isEditing = false;
        let input;

        editBtn.addEventListener("click", () => {
            if (!isEditing) {
                input = document.createElement("input");
                input.type = "text";
                input.value = task.task;
                input.style.flexGrow = "1";

                li.replaceChild(input, span);
                editBtn.textContent = "💾";
                isEditing = true;
            } else {
                const updatedText = input.value.trim();
                if (updatedText === "") {
                    alert("⚠️ Task cannot be empty!");
                    return;
                }

                updateTask(task.id, updatedText, checkbox.checked)
                    .then(() => {
                        task.task = updatedText;
                        span.textContent = updatedText;
                        li.replaceChild(span, input);
                        editBtn.textContent = "✏️";
                        isEditing = false;
                    });
            }
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "🗑️";
        deleteBtn.classList.add("delete");
        deleteBtn.addEventListener("click", () => deleteTask(task.id));

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    }

    function toggleComplete(id, completed) {
        fetch(`/tasks/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ completed })
        })
        .then(() => {
            const currentFilter = filterSelect.value;
            if (currentFilter !== "all") {
                fetchTasks();
            } else {
                const li = document.querySelector(`li[data-id='${id}']`);
                if (li) {
                    li.classList.toggle("completed", completed);
                }
            }
        });
    }

    function updateTask(id, newText, completed) {
        return fetch(`/tasks/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ task: newText, completed })
        });
    }

    function deleteTask(id) {
        fetch(`/tasks/${id}`, { method: "DELETE" })
            .then(() => {
                const li = document.querySelector(`li[data-id='${id}']`);
                if (li) li.remove();
            });
    }

    function applyTheme(theme) {
        document.body.className = "";
        if (theme !== "default") {
            document.body.classList.add(`theme-${theme}`);
        }
    }

    addTaskButton.addEventListener("click", addTask);
    filterSelect.addEventListener("change", fetchTasks);
    darkModeToggle.addEventListener("change", () => {
        document.body.classList.toggle("dark-mode");
        localStorage.setItem("darkMode", darkModeToggle.checked);
    });
    themeSelect.addEventListener("change", () => {
        const selected = themeSelect.value;
        applyTheme(selected);
        localStorage.setItem("theme", selected);
    });

    fetchTasks();
});
