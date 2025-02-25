document.addEventListener("DOMContentLoaded", function () {
    const otpVerified = localStorage.getItem("otpVerified");

    // If OTP is not verified, redirect silently
    if (otpVerified !== "true") {
        window.location.replace("forgot-password.html"); // Silent redirection
    }

    const newPasswordInput = document.getElementById("new-password");
    const confirmPasswordInput = document.getElementById("confirm-password");
    const strengthIndicator = document.getElementById("strength-indicator");
    const resetButton = document.getElementById("reset-button");
    const passwordError = document.getElementById("password-error");

    // Password Strength Checker
    newPasswordInput.addEventListener("input", function () {
        updateStrengthIndicator(checkPasswordStrength(newPasswordInput.value));
    });

    function checkPasswordStrength(password) {
        if (password.length < 6) return "weak";
        if (/[A-Z]/.test(password) && /[0-9]/.test(password) && /[\W_]/.test(password)) {
            return "strong";
        }
        return "medium";
    }

    function updateStrengthIndicator(strength) {
        const colors = { weak: "red", medium: "orange", strong: "green" };
        const bars = strengthIndicator.querySelectorAll("div");
        bars.forEach((bar, index) => {
            bar.style.backgroundColor = index < (strength === "weak" ? 1 : strength === "medium" ? 2 : 3) ? colors[strength] : "lightgray";
        });
    }

    // Handle password reset
    resetButton.addEventListener("click", async function () {
        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        const email = localStorage.getItem("resetEmail");

        passwordError.style.display = "none";
        if (!newPassword || !confirmPassword) {
            displayError("Fields cannot be empty!");
            return;
        }
        if (newPassword !== confirmPassword) {
            displayError("Passwords do not match!");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, newPassword })
            });
            const data = await response.json();
            
            if (response.ok) {
                alert("Password reset successful! Redirecting to login.");
                localStorage.removeItem("otpVerified");
                localStorage.removeItem("resetEmail");
                window.location.href = "index.html";
            } else {
                displayError(data.error || "Error resetting password");
            }
        } catch (error) {
            console.error("Error resetting password:", error);
            displayError("Something went wrong. Try again!");
        }
    });

    function displayError(message) {
        passwordError.textContent = message;
        passwordError.style.display = "block";
    }
});
