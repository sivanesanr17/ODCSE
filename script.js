document.getElementById("login-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("error-message");
    errorMessage.textContent = "";
    errorMessage.style.display = "none";
    try {
        const response = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        console.log("Response Data:", data); 
        if (response.ok) {
            localStorage.setItem("token", data.token); 
            window.location.href = "dashboard.html"; 
        } else {
            errorMessage.textContent = data.message || "Check email or password";
            errorMessage.style.display = "block";
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        errorMessage.textContent = "⚠️ Failed to connect to the server.";
        errorMessage.style.display = "block";
    }
});
