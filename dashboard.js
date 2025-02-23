document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "index.html"; 
    }
});
document.getElementById("logout-btn").addEventListener("click", function () {
    localStorage.removeItem("token"); 
    window.location.href = "index.html"; 
});
