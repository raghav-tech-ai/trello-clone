async function loadDashboard() {
    try {
        const response = await api.get("/dashboard");
        const orgs = response.data.organization;

        const container = document.getElementById("org-list");
        container.innerHTML = "";

        orgs.forEach((org) => {
            const card = document.createElement("div");
            card.className = "org-card";
            card.innerHTML = `
                <h3 class="org-title">${org.title}</h3>
                <p class="org-description">${org.description || ""}</p>
                <span class="role-badge">${org.role}</span>
            `;

            card.addEventListener("click", () => {
                window.location.href = `organization.html?orgId=${org.id}`;
            });

            container.appendChild(card);
        });

        const newOrgCard = document.createElement("div");
        newOrgCard.className = "new-org-card";
        newOrgCard.textContent = "+ New Organization";
        newOrgCard.addEventListener("click", createOrganization);
        container.appendChild(newOrgCard);

    } catch (error) {
        if (error.response) {
            alert(error.response.data.message);
        } else {
            alert("Something went wrong loading your dashboard.");
        }
    }
}

async function createOrganization() {
    const title = prompt("Organization name:");
    if (!title) return;

    const description = prompt("Organization description (optional):");

    try {
        await api.post("/organization", {
            title: title,
            description: description
        });

        loadDashboard();

    } catch (error) {
        if (error.response) {
            alert(error.response.data.message);
        } else {
            alert("Something went wrong creating the organization.");
        }
    }
}

loadDashboard();