const orgId = new URLSearchParams(window.location.search).get("orgId");

async function showOrgDetails() {
    try {
        const response = await api.get(`/organizations/${orgId}`);
        const org = response.data.organization;

        const response2 = await api.get(`/organizations/${orgId}/boards`);
        const boards = response2.data.boards;

        const boardContainer = document.getElementById("board-list");
        boardContainer.innerHTML = "";
        boards.forEach((board) => {
            const card = document.createElement("div");
            card.className = "board-card";
            card.textContent = board.title;
            card.addEventListener("click", () => {
                window.location.href = `board.html?boardId=${board.id}`;
            });
            boardContainer.appendChild(card);
        });

        const memberContainer = document.getElementById("member-list");
        memberContainer.innerHTML = "";
        org.members.forEach((member) => {
            const card = document.createElement("div");
            card.className = "member-row";
            card.innerHTML = `
                <span class="member-username">${member.username}</span>
                <div>
                    <button class="remove-btn">Remove</button>
                </div>
            `;
            memberContainer.appendChild(card);
        });

        if (org.role === "member") {
            document.getElementById("delete-org-btn").style.display = "none";
            document.getElementById("create-board-btn").style.display = "none";
            document.getElementById("add-member-btn").style.display = "none";

            const removeButtons = document.getElementsByClassName("remove-btn");
            for (let i = 0; i < removeButtons.length; i++) {
                removeButtons[i].style.display = "none";
            }
        }

    } catch (error) {
        if (error.response) {
            alert(error.response.data.message);
        } else {
            alert("Something went wrong. Please try again.");
        }
    }
}

async function createBoard() {
    const title = prompt("Board name:");
    if (!title) return;

    try {
        await api.post(`/organizations/${orgId}/boards`, {
            title: title
        });

        showOrgDetails();

    } catch (error) {
        if (error.response) {
            alert(error.response.data.message);
        } else {
            alert("Something went wrong creating the board.");
        }
    }
}

document.getElementById("create-board-btn").addEventListener("click", createBoard);

showOrgDetails();