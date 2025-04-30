document.addEventListener("DOMContentLoaded", function () {
    const taskInput = document.getElementById("taskInput");
    const taskList = document.getElementById("taskList");
    const addTaskButton = document.getElementById("addTaskBtn");
    const darkModeToggle = document.getElementById("toggleDarkMode");
    const themeSelect = document.getElementById("themeSelect");
    const filterSelect = document.getElementById("filterSelect");
    const logoutBtn = document.getElementById("logoutBtn");
    const logoutSection = document.getElementById("logoutSection"); // Added logout section

    // Auth elements
    const signupBtn = document.getElementById("signupBtn");
    const loginBtn = document.getElementById("loginBtn");
    const signupForm = document.getElementById("signupForm");
    const loginForm = document.getElementById("loginForm");
    const signupSubmitBtn = document.getElementById("signupSubmitBtn");
    const loginSubmitBtn = document.getElementById("loginSubmitBtn");
    const closeSignupForm = document.getElementById("closeSignupForm");
    const closeLoginForm = document.getElementById("closeLoginForm");
    const taskSection = document.getElementById("taskSection");
    const authLinks = document.getElementById("authLinks");
    const forgotPasswordLink = document.getElementById("forgotPasswordLink");

    // Password toggle
    const toggleLoginPassword = document.getElementById("toggleLoginPassword");
    const toggleSignupPassword = document.getElementById("toggleSignupPassword");

    // Function to check if user is logged in (basic client-side check)
    function isLoggedIn() {
        return localStorage.getItem('loggedIn') === 'true';
    }

    // Function to get the current user ID
    function getCurrentUserID() {
        return localStorage.getItem('userID');
    }

    // Function to update UI based on login status
    function updateAuthUI() {
        if (isLoggedIn()) {
            authLinks.style.display = "none";
            logoutSection.style.display = "block";
            taskSection.style.display = "block";
            fetchTasksByUserID(getCurrentUserID());
        } else {
            authLinks.style.display = "block";
            logoutSection.style.display = "none";
            taskSection.style.display = "none";
            taskList.innerHTML = "";
        }
    }

    // Apply theme from localStorage
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
        applyTheme(savedTheme);
        themeSelect.value = savedTheme;
    }

    if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark-mode");
        darkModeToggle.checked = true;
    }

    // ---------- AUTH FUNCTIONS ----------
    function showForm(form) {
        form.style.display = "block";
    }

    function hideForm(form) {
        form.style.display = "none";
    }

    signupBtn.addEventListener("click", () => {
        showForm(signupForm);
        hideForm(loginForm);
    });

    loginBtn.addEventListener("click", () => {
        showForm(loginForm);
        hideForm(signupForm);
    });

    if (closeSignupForm) closeSignupForm.addEventListener("click", () => hideForm(signupForm));
    if (closeLoginForm) closeLoginForm.addEventListener("click", () => hideForm(loginForm));

    function displayTaskSection() {
        authLinks.style.display = "none";
        logoutSection.style.display = "block";
        taskSection.style.display = "block";
    }

    // Password Toggle
    function setupPasswordToggle(toggleElement, inputField) {
        toggleElement.addEventListener("click", () => {
            if (inputField.type === "password") {
                inputField.type = "text";
                toggleElement.textContent = "🙈";
            } else {
                inputField.type = "password";
                toggleElement.textContent = "👁";
            }
        });
    }
    setupPasswordToggle(toggleLoginPassword, document.getElementById("loginPassword"));
    setupPasswordToggle(toggleSignupPassword, document.getElementById("signupPassword"));

    // Validate email domain
    function isValidEmailDomain(email) {
        const domainPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}$/;
        return domainPattern.test(email);
    }

    // Signup
    signupSubmitBtn.addEventListener("click", () => {
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value.trim();

        if (!email || !password) {
            alert("⚠️ Please fill in both fields!");
            return;
        }

        if (!isValidEmailDomain(email)) {
            alert("⚠️ Please enter a valid email address!");
            return;
        }

        fetch("/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        })
            .then(response => {
                if (response.ok) {
                    alert("✅ Signup successful! You can now log in.");
                    hideForm(signupForm);
                } else {
                    response.json().then(data => alert("❌ Signup failed: " + data.error));
                }
            })
            .catch(error => console.error("Signup error:", error));
    });

    // Login
    loginSubmitBtn.addEventListener("click", () => {
        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value.trim();

        if (!email || !password) {
            alert("⚠️ Please fill in both fields!");
            return;
        }

        fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        })
            .then(response => response.json())
            .then(data => {
                if (data.userID) {
                    localStorage.setItem('loggedIn', 'true');
                    localStorage.setItem('userID', data.userID);
                    hideForm(loginForm);
                    updateAuthUI();
                } else {
                    alert("❌ Login failed. Check your credentials.");
                }
            })
            .catch(error => console.error("Login error:", error));
    });

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            fetch("/logout", { method: "POST" })
                .then(response => {
                    if (response.ok) {
                        localStorage.removeItem('loggedIn');
                        localStorage.removeItem('userID');
                        alert("👋 Logged out successfully!");
                        updateAuthUI();
                    }
                    else {
                        alert("⚠️ Logout failed.");
                    }
                })
                .catch(error => console.error("Logout error:", error));
        });


        // Forgot Password
        forgotPasswordLink.addEventListener("click", (e) => {
            e.preventDefault();
            const email = prompt("Please enter your registered email:");
            if (!email) {
                alert("⚠️ Email is required!");
                return;
            }
            fetch("/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            })
                .then(response => response.json())
                .then(data => alert(data.message))
                .catch(error => console.error("Forgot Password error:", error));
        });

        // ---------- TASK FUNCTIONS ----------
        function addTask() {
            const taskText = taskInput.value.trim();
            if (taskText === "") return alert("⚠️ Please enter a task!");

            fetch("/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    task: taskText,
                    userID: getCurrentUserID()
                })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.task) {
                        addTaskToUI(data.task);
                        taskInput.value = "";
                    }
                })
                .catch(error => console.error("Add Task error:", error));
        }

        function fetchTasksByUserID(userID) {
            if (!userID) {
                console.error("No user ID available");
                localStorage.removeItem('loggedIn');
                updateAuthUI();
                return;
            }

            fetch(`/tasks/user/${userID}`)
                .then(response => {
                    if (!response.ok) {
                        localStorage.removeItem('loggedIn');
                        updateAuthUI();
                        return [];
                    }
                    return response.json();
                })
                .then(tasks => {
                    const filter = filterSelect.value;
                    const filteredTasks = tasks.filter(task => {
                        if (filter === "completed") return task.completed;
                        if (filter === "pending") return !task.completed;
                        return true;
                    });
                    taskList.innerHTML = "";
                    filteredTasks.forEach(addTaskToUI);
                    document.getElementById("emptyStateMsg").style.display = filteredTasks.length === 0 ? "block" : "none";
                })
                .catch(error => console.error("Fetch Tasks error:", error));
        }

        // Legacy function kept for compatibility
        function fetchTasks() {
            fetchTasksByUserID(getCurrentUserID());
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
                        fetchTasksByUserID(getCurrentUserID());
                    } else {
                        const li = document.querySelector(`li[data-id='${id}']`);
                        if (li) li.classList.toggle("completed", completed);
                    }
                })
                .catch(error => console.error("Toggle Complete error:", error));
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
                    if (taskList.children.length === 0) {
                        document.getElementById("emptyStateMsg").style.display = "block";
                    }
                })
                .catch(error => console.error("Delete Task error:", error));
        }

        function applyTheme(theme) {
            document.body.className = "";
            if (theme !== "default") {
                document.body.classList.add(`theme-${theme}`);
            }
        }

        // ---------- Event Listeners ----------
        addTaskButton.addEventListener("click", addTask);

        taskInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") addTask();
        });

        filterSelect.addEventListener("change", () => fetchTasksByUserID(getCurrentUserID()));
        darkModeToggle.addEventListener("change", () => {
            document.body.classList.toggle("dark-mode");
            localStorage.setItem("darkMode", darkModeToggle.checked);
        });
        themeSelect.addEventListener("change", () => {
            const selected = themeSelect.value;
            applyTheme(selected);
            localStorage.setItem("theme", selected);
        });

        // Initial load and auth check
        updateAuthUI();
    }
});