document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  const tabs = document.querySelectorAll("nav ul li a");
  const tabContents = document.querySelectorAll(".tab-content");
  const addUserBtn = document.getElementById("addUserBtn");
  const addUserFormContainer = document.getElementById("addUserFormContainer");
  const addUserForm = document.getElementById("addUserForm");
  const cancelAddUserBtn = document.getElementById("cancelAddUserBtn");
  const userTable = document.getElementById("userTable");
  const filters = {
    status: document.getElementById("donationStatus"),
    community: document.getElementById("donationCommunity"),
  };
  const applyFiltersBtn = document.getElementById("applyFiltersBtn");

  // Logout button handler
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html"; // Redirect to login page
  });

  // Tab switching logic
  tabs.forEach((tab) => {
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = tab.getAttribute("href").substring(1);

      tabContents.forEach((content) => {
        if (content.id === targetId) {
          content.style.display = "block";
        } else {
          content.style.display = "none";
        }
      });
    });
  });

  // Initialize with the first tab active
  if (tabs.length > 0) {
    tabs[0].click();
  }

  // Add User Button Handler
  addUserBtn.addEventListener("click", () => {
    addUserFormContainer.style.display = "block";
    scrollToSection(addUserFormContainer); // Smooth scroll to the add user form
  });

  // Cancel Add User Button Handler
  cancelAddUserBtn.addEventListener("click", () => {
    addUserFormContainer.style.display = "none";
  });

  // Add User Form Submission
  addUserForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(addUserForm);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
    };

    try {
      const response = await fetch("http://localhost:8090/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert("User added successfully");
        loadUsers();
        addUserFormContainer.style.display = "none";
      } else {
        alert("Error adding user");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  });

  // Load Users
  const loadUsers = async () => {
    try {
      const response = await fetch("http://localhost:8090/users", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const users = await response.json();
        const userTableBody = userTable.querySelector("tbody"); // Target table body
        userTableBody.innerHTML = ""; // Clear existing users
        users.forEach((user) => {
          const userRow = document.createElement("tr");
          userRow.innerHTML = `
                        <td>${user.user_id}</td>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td>${user.role}</td>
                        <td>
                            <button class="delete-btn" data-id="${user.user_id}">Delete</button>
                        </td>
                    `;
          userTableBody.appendChild(userRow);
        });
      } else {
        alert("Error loading users");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  loadUsers();

  // Delete User Handler
  userTable.addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-btn")) {
      const userId = event.target.getAttribute("data-id");
      const confirmation = confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      );

      if (confirmation) {
        try {
          const response = await fetch(`http://localhost:8090/user/${userId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });

          if (response.ok) {
            alert("User deleted successfully");
            loadUsers();
          } else {
            alert("Error deleting user");
          }
        } catch (error) {
          console.error("Error:", error);
        }
      }
    }
  }); 
});
