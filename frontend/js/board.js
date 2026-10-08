async function showBoardDetails() {
    try {
        const boardId = new URLSearchParams(window.location.search).get("boardId");

        const response = await api.get(`/boards/${boardId}`);
        const issue_board = response.data.issues;

        const todo_container = document.getElementById("todo-list");
        todo_container.innerHTML = "";

        const inprogress_container = document.getElementById("inprogress-list");
        inprogress_container.innerHTML = "";

        const donelist_container = document.getElementById("done-list");
        donelist_container.innerHTML = "";

        issue_board.forEach((issue) => {
            if (issue.status === "todo") {
                const card = document.createElement("div");
                card.className = "issue-card";
                card.innerText = issue.title;
                todo_container.appendChild(card);
            } else if (issue.status === "in-progress") {
                const card = document.createElement("div");
                card.className = "issue-card";
                card.innerText = issue.title;
                inprogress_container.appendChild(card);
            } else {
                const card = document.createElement("div");
                card.className = "issue-card";
                card.innerText = issue.title;
                donelist_container.appendChild(card);
            }
        })

        if (response.data.role === "member") {
            document.getElementById("delete-board-btn").style.display = "none";

            const addIssueBtn = document.getElementsByClassName("add-issue-link");
            for (let i = 0; i < addIssueBtn.length; i++) {
                addIssueBtn[i].style.display = "none";
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

showBoardDetails();