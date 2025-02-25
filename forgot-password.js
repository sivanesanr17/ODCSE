document.getElementById("forgot-password-form").addEventListener("submit", async function (event) {
    event.preventDefault(); 
    const email = document.getElementById("forgot-email").value;
    const errorMessage = document.getElementById("forgot-password-error");
    
    // Clear previous error messages
    errorMessage.textContent = "";
    errorMessage.style.display = "none"; // Hide error initially

    try {
        const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            if (data.exists) {
                localStorage.setItem("resetEmail", email);
                document.querySelector(".login-page form").innerHTML = `
                    <h2>Enter OTP</h2>
                    <p>A 6-digit OTP has been sent to your email.</p>
                    <div class="input-box">
                        <i class="fas fa-key"></i>
                        <input type="text" id="otp-input" placeholder="Enter OTP" required maxlength="6">
                    </div>
                    <div>
                        <button id="verify-otp-btn">Verify OTP</button>
                    </div>
                    <p id="otp-error" class="error-message"></p>
                    <p><a href="index.html">Back to Login</a></p>
                `;

                document.getElementById("verify-otp-btn").addEventListener("click", async function () {
                    const otp = document.getElementById("otp-input").value;
                    const otpError = document.getElementById("otp-error");

                    // Clear previous error messages
                    otpError.textContent = "";
                    otpError.style.display = "none";

                    try {
                        const otpResponse = await fetch("http://localhost:5000/api/auth/verify-otp", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email, otp })
                        });

                        const otpData = await otpResponse.json();

                        if (otpResponse.ok) {
                            localStorage.setItem("otpVerified", "true"); // Store OTP verification status
                            window.location.href = "reset-password.html";
                        } else {
                            otpError.textContent = otpData.error || "Invalid or expired OTP. Please try again.";
                            otpError.style.display = "block";
                        }
                    } catch (error) {
                        otpError.textContent = "An error occurred while verifying OTP.";
                        otpError.style.display = "block";
                    }
                });

            } else {
                // Show error below the Get OTP button
                errorMessage.textContent = "Invalid email. Please enter a registered college email.";
                errorMessage.style.display = "block";
            }
        } else {
            errorMessage.textContent = data.error || "An error occurred.";
            errorMessage.style.display = "block";
        }
    } catch (error) {
        errorMessage.textContent = "An error occurred. Please try again.";
        errorMessage.style.display = "block";
    }
});
