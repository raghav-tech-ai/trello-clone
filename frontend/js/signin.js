const form = document.getElementById("signin-form");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await api.post("/signin", {
            username: username,
            password: password
        });

        localStorage.setItem("token",response.data.token);
        window.location.href = "dashboard.html";

    } catch (error) {
        if (error.response) {
            alert(error.response.data.message);
        } else {
            alert("Something went wrong. Please try again.");
        }
    }
});