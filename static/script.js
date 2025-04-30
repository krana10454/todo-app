document.addEventListener("DOMContentLoaded", function () {
        // DOM Elements
    const taskInput = document.getElementById("taskInput");
    const taskList = document.getElementById("taskList");
    const addTaskButton = document.getElementById("addTaskBtn");
    const darkModeToggle = document.getElementById("toggleDarkMode");
    const themeSelect = document.getElementById("themeSelect");
    const filterSelect = document.getElementById("filterSelect");
    const logoutBtn = document.getElementById("logoutBtn");
    const logoutSection = document.getElementById("logoutSection");
    const emptyStateMsg = document.getElementById("emptyStateMsg");
    const notificationContainer = document.getElementById("notificationContainer");
    const taskItemTemplate = document.getElementById("taskItemTemplate");
    const notificationTemplate = document.getElementById("notificationTemplate");

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

    // Password toggle elements
    const toggleLoginPassword = document.getElementById("toggleLoginPassword");
    const toggleSignupPassword = document.getElementById("toggleSignupPassword");
    const loginPassword = document.getElementById("loginPassword");
    const signupPassword = document.getElementById("signupPassword");

    // ---------- UTILITY FUNCTIONS ----------
    
    // Auth utility functions
    function isLoggedIn() {
        return localStorage.getItem('loggedIn') === 'true';
    }

    function getCurrentUserID() {
        return localStorage.getItem('userID');
    }

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

    // Show notification function
    function showNotification(message, type = 'success') {
        const notif = notificationTemplate.content.cloneNode(true);
        const notifElement = notif.querySelector('.notification');
        
        notifElement.classList.add(type);
        notifElement.querySelector('.notification-message').textContent = message;
        
        // Update SVG based on notification type
        const svgElement = notifElement.querySelector('svg');
        if (type === 'success') {
            svgElement.innerHTML = `
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            `;
        } else if (type === 'error') {
            svgElement.innerHTML = `
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            `;
        }
        
        notificationContainer.appendChild(notifElement);
        
        // Remove notification after animation completes
        setTimeout(() => {
            notifElement.remove();
        }, 3000);
    }

    // Apply theme from localStorage
    function applyTheme(theme) {
        // Remove all theme classes first
        document.body.classList.remove('dark-mode', 'theme-ocean', 'theme-forest');
        
        // Apply selected theme
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else if (theme !== 'default') {
            document.body.classList.add(`theme-${theme}`);
        }
        
        localStorage.setItem("theme", theme);
    }

    // ---------- AUTH FUNCTIONS ----------
    function showForm(form) {
        form.style.display = "block";
    }

    function hideForm(form) {
        form.style.display = "none";
    }

    function setupPasswordToggle(toggleElement, inputField) {
        toggleElement.addEventListener("click", () => {
            if (inputField.type === "password") {
                inputField.type = "text";
                toggleElement.querySelector('svg').innerHTML = `
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                `;
            } else {
                inputField.type = "password";
                toggleElement.querySelector('svg').innerHTML = `
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                `;
            }
        });
    }

    // Validate email domain
    function isValidEmailDomain(email) {
        const domainPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}$/;
        return domainPattern.test(email);
    }

    // Validate password strength
    function isValidPassword(password) {
        // At least 8 characters, one uppercase, one digit, one special character
        const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[@#$&*!]).{8,}$/;
        return passwordPattern.test(password);
    }

    // ---------- TASK FUNCTIONS ----------
    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === "") {
            showNotification("Please enter a task!", "error");
            return;
        }

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
                showNotification("Task added successfully!");
                updateEmptyState();
            }
        })
        .catch(error => {
            console.error("Add Task error:", error);
            showNotification("Failed to add task. Please try again.", "error");
        });
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
                updateEmptyState();
            })
            .catch(error => {
                console.error("Fetch Tasks error:", error);
                showNotification("Failed to load tasks. Please try again.", "error");
            });
    }

    function updateEmptyState() {
        emptyStateMsg.style.display = taskList.children.length === 0 ? "flex" : "none";
    }

    function addTaskToUI(task) {
        // Clone the template
        const taskItem = taskItemTemplate.content.cloneNode(true);
        const li = taskItem.querySelector('.task-item');
        
        // Set task data
        li.dataset.id = task.id;
        li.querySelector('.task-content').textContent = task.task;
        
        // Set completed state
        const checkbox = li.querySelector('input[type="checkbox"]');
        checkbox.checked = task.completed;
        if (task.completed) {
            li.classList.add('completed');
        }
        
        // Event listeners
        checkbox.addEventListener('change', () => {
            toggleComplete(task.id, checkbox.checked, li);
        });
        
        // Edit button
        li.querySelector('.edit').addEventListener('click', () => {
            editTask(li, task.id);
        });
        
        // Delete button
        li.querySelector('.delete').addEventListener('click', () => {
            deleteTask(task.id, li);
        });
        
        // Add to list
        taskList.appendChild(li);
    }

    function toggleComplete(id, completed, taskElement) {
        fetch(`/tasks/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ completed })
        })
        .then(() => {
            const currentFilter = filterSelect.value;
            if ((currentFilter === "completed" && !completed) || 
                (currentFilter === "pending" && completed)) {
                // Task no longer matches filter, remove from UI
                taskElement.classList.add('deleting');
                setTimeout(() => {
                    taskElement.remove();
                    updateEmptyState();
                }, 300);
            } else {
                // Update UI with animation
                taskElement.classList.toggle('completed', completed);
                taskElement.classList.add('completing');
                setTimeout(() => {
                    taskElement.classList.remove('completing');
                }, 500);
            }
            
            showNotification(completed ? "Task completed!" : "Task marked as pending");
        })
        .catch(error => {
            console.error("Toggle Complete error:", error);
            showNotification("Failed to update task status", "error");
            // Revert checkbox state
            const checkbox = taskElement.querySelector('input[type="checkbox"]');
            checkbox.checked = !completed;
            taskElement.classList.toggle('completed', !completed);
        });
    }

    function editTask(taskElement, taskId) {
        const contentDiv = taskElement.querySelector('.task-content');
        const currentText = contentDiv.textContent;
        
        // Create input element
        const inputEl = document.createElement('input');
        inputEl.type = 'text';
        inputEl.value = currentText;
        inputEl.className = 'edit-input';
        inputEl.style.width = '100%';
        
        // Replace content with input
        contentDiv.textContent = '';
        contentDiv.appendChild(inputEl);
        
        // Focus on input
        inputEl.focus();
        
        // Change edit button to save button
        const editButton = taskElement.querySelector('.edit');
        const originalEditButtonSVG = editButton.innerHTML;
        editButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        `;
        
        // Function to save changes
        const saveChanges = () => {
            const newText = inputEl.value.trim();
            if (!newText) {
                showNotification("Task content cannot be empty", "error");
                return;
            }
            
            const isCompleted = taskElement.classList.contains('completed');
            
            fetch(`/tasks/${taskId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ task: newText, completed: isCompleted })
            })
            .then(response => {
                if (response.ok) {
                    contentDiv.textContent = newText;
                    editButton.innerHTML = originalEditButtonSVG;
                    showNotification("Task updated successfully");
                } else {
                    throw new Error("Failed to update task");
                }
            })
            .catch(error => {
                console.error("Update Task error:", error);
                showNotification("Failed to update task", "error");
                contentDiv.textContent = currentText;
                editButton.innerHTML = originalEditButtonSVG;
            });
        };
        
        // Add event listeners for save on enter/blur
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveChanges();
            } else if (e.key === 'Escape') {
                contentDiv.textContent = currentText;
                editButton.innerHTML = originalEditButtonSVG;
            }
        });
        
        editButton.addEventListener('click', saveChanges, { once: true });
        
        // Handle clicking outside
        const clickOutsideHandler = (e) => {
            if (!contentDiv.contains(e.target) && !editButton.contains(e.target)) {
                saveChanges();
                document.removeEventListener('click', clickOutsideHandler);
            }
        };
        
        // Add delay to avoid immediate trigger
        setTimeout(() => {
            document.addEventListener('click', clickOutsideHandler);
        }, 10);
    }

    function deleteTask(id, taskElement) {
        // Add delete animation
        taskElement.classList.add('deleting');
        
        fetch(`/tasks/${id}`, { method: "DELETE" })
            .then(response => {
                if (response.ok) {
                    // Remove after animation completes
                    setTimeout(() => {
                        taskElement.remove();
                        updateEmptyState();
                    }, 300);
                    showNotification("Task deleted successfully");
                } else {
                    throw new Error("Failed to delete task");
                }
            })
            .catch(error => {
                console.error("Delete Task error:", error);
                taskElement.classList.remove('deleting'); // Remove animation
                showNotification("Failed to delete task", "error");
            });
    }

    // ---------- EVENT LISTENERS ----------

    // Auth event listeners
    signupBtn.addEventListener("click", () => {
        showForm(signupForm);
        hideForm(loginForm);
    });

    loginBtn.addEventListener("click", () => {
        showForm(loginForm);
        hideForm(signupForm);
    });

    closeSignupForm.addEventListener("click", () => hideForm(signupForm));
    closeLoginForm.addEventListener("click", () => hideForm(loginForm));

    // Password toggle
    setupPasswordToggle(toggleLoginPassword, loginPassword);
    setupPasswordToggle(toggleSignupPassword, signupPassword);

    // Signup submission
    signupSubmitBtn.addEventListener("click", () => {
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value.trim();

        if (!email || !password) {
            showNotification("Please fill in both fields!", "error");
            return;
        }

        if (!isValidEmailDomain(email)) {
            showNotification("Please enter a valid email address!", "error");
            return;
        }

        if (!isValidPassword(password)) {
            showNotification("Password does not meet security requirements!", "error");
            return;
        }

        fetch("/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        })
        .then(response => {
            if (response.ok) {
                showNotification("Signup successful! You can now log in.");
                hideForm(signupForm);
                showForm(loginForm);
                document.getElementById("loginEmail").value = email;
            } else {
                return response.json().then(data => {
                    throw new Error(data.error || "Signup failed");
                });
            }
        })
        .catch(error => {
            console.error("Signup error:", error);
            showNotification(error.message || "Signup failed", "error");
        });
    });

    // Login submission
    loginSubmitBtn.addEventListener("click", () => {
        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value.trim();

        if (!email || !password) {
            showNotification("Please fill in both fields!", "error");
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
                showNotification("Login successful! Welcome back.");
            } else {
                throw new Error(data.error || "Login failed");
            }
        })
        .catch(error => {
            console.error("Login error:", error);
            showNotification("Login failed. Check your credentials.", "error");
        });
    });

    // Logout
    logoutBtn.addEventListener("click", () => {
        fetch("/logout", { method: "POST" })
            .then(response => {
                if (response.ok) {
                    localStorage.removeItem('loggedIn');
                    localStorage.removeItem('userID');
                    showNotification("Logged out successfully!");
                    updateAuthUI();
                } else {
                    throw new Error("Logout failed");
                }
            })
            .catch(error => {
                console.error("Logout error:", error);
                showNotification("Logout failed", "error");
            });
    });

    // Forgot Password
    forgotPasswordLink.addEventListener("click", (e) => {
        e.preventDefault();
        const email = prompt("Please enter your registered email:");
        if (!email) {
            showNotification("Email is required!", "error");
            return;
        }
        
        if (!isValidEmailDomain(email)) {
            showNotification("Please enter a valid email address!", "error");
            return;
        }
        
        fetch("/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        })
        .then(response => response.json())
        .then(data => {
            showNotification(data.message || "Password reset instructions sent to your email");
        })
        .catch(error => {
            console.error("Forgot Password error:", error);
            showNotification("Failed to process password reset request", "error");
        });
    });

    // Task management
    addTaskButton.addEventListener("click", addTask);

    taskInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            addTask();
        }
    });

    // Filter, theme, and dark mode
    filterSelect.addEventListener("change", () => {
        if (isLoggedIn()) {
            fetchTasksByUserID(getCurrentUserID());
        }
    });

    darkModeToggle.addEventListener("change", () => {
        document.body.classList.toggle("dark-mode", darkModeToggle.checked);
        localStorage.setItem("darkMode", darkModeToggle.checked);
        
        // Update theme selector to match dark mode state
        if (darkModeToggle.checked && themeSelect.value === 'default') {
            themeSelect.value = 'dark';
            localStorage.setItem("theme", 'dark');
        } else if (!darkModeToggle.checked && themeSelect.value === 'dark') {
            themeSelect.value = 'default';
            localStorage.setItem("theme", 'default');
        }
    });

    themeSelect.addEventListener("change", () => {
        const selected = themeSelect.value;
        applyTheme(selected);
        
        // Update dark mode toggle to match theme
        darkModeToggle.checked = (selected === 'dark' || document.body.classList.contains('dark-mode'));
        localStorage.setItem("darkMode", darkModeToggle.checked);
    });

    // ---------- INITIALIZATION ----------
    
    // Load saved theme
    const savedTheme = localStorage.getItem("theme") || "default";
    themeSelect.value = savedTheme;
    applyTheme(savedTheme);
    
    // Set dark mode
    if (localStorage.getItem("darkMode") === "true" || savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        darkModeToggle.checked = true;
    }
    
    // Check authentication and show appropriate UI
    updateAuthUI();
});