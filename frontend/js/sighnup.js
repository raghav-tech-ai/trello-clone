const form = document.getElementById("signup-form");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    try {
        const response = await api.post("/signup", {
            username: username,
            password: password
        });

        alert(response.data.message);
        window.location.href = "signin.html";

    } catch (error) {
        if (error.response) {
            alert(error.response.data.message);
        } else {
            alert("Something went wrong. Please try again.");
        }
    }
});