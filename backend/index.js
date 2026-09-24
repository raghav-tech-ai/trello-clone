require("dotenv").config()
const express = require("express");
const jwt = require("jsonwebtoken");
const { authmiddleware } = require("./middleware")

let USERS_ID = 1;
let ORGANIZATIONS_ID = 1;
let BOARDS_ID = 1;
let ISSUES_ID = 1;
let VALID_STATUS = ["todo", "in-progress", "done"];

const USERS = [];

let ORGANIZATIONS = [];

const BOARDS = [];

let ISSUES = []

const app = express();

app.use(express.json());

app.post("/signup", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;



    const userExists = USERS.find(u => u.username === username);
    if (userExists) {
        res.status(411).json({
            message: "user with this username already exists"
        })
        return;
    }

    if (!username || !password) {
        res.status(400).json({
            message: "username and password are required!"
        })
        return;
    }

    USERS.push({
        id: USERS_ID++,
        username: username,
        password: password
    })

    res.json({
        message: "you have signed up successfully"
    })

})

app.post("/signin", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const userExist = USERS.find(u => u.username === username && u.password === password);
    if (!userExist) {
        res.status(411).json({
            message: "Incorrect credentials"
        })
        return;
    }

    const token = jwt.sign({ userId: userExist.id }, process.env.JWT_SECRET);

    res.json({
        token: token
    })
})

app.get("/dashboard", authmiddleware, (req, res) => {
    const userId = req.userId;
    const userOrg = ORGANIZATIONS.filter(org => org.admin === userId || org.member.includes(userId));

    const result = userOrg.map(org => {
        const role = org.admin === userId ? "admin" : "member";
        return {
            id: org.id,
            title: org.title,
            description: org.description,
            role: role
        }
    });

    res.json({
        organization: result
    })
})

app.post("/organization", authmiddleware, (req, res) => {
    const userId = req.userId;
    ORGANIZATIONS.push({
        id: ORGANIZATIONS_ID++,
        title: req.body.title,
        description: req.body.description,
        admin: userId,
        member: []
    })
    res.json({
        message: "org created",
        id: ORGANIZATIONS_ID - 1
    })
})

app.get("/organizations/:orgId", authmiddleware, (req, res) => {
    const userId = req.userId;
    const organization_id = parseInt(req.params.orgId);

    const organization = ORGANIZATIONS.find(org => org.id === organization_id);
    if (!organization) {
        return res.status(404).json({
            message: "there is no such organization"
        });
    }

    const isAdmin = organization.admin === userId;
    const isMember = organization.member.includes(userId);

    if (!isAdmin && !isMember) {
        return res.status(403).json({
            message: "you are not a member of this organization"
        });
    }

    res.json({
        organization: {
            id: organization.id,
            title: organization.title,
            role: isAdmin ? "admin" : "member",
            members: organization.member.map(memberId => {
                const user = USERS.find(u => u.id === memberId);
                return {
                    id: user.id,
                    username: user.username
                };
            })
        }
    });
})

app.delete("/organizations/:orgId", authmiddleware, (req,res)=>{
    const userId = req.userId;
    const organization_id = parseInt(req.params.orgId);

    const organization = ORGANIZATIONS.find(org=>org.id===organization_id);
    if(!organization){
        return res.status(403).json({
            message:"no such organization!"
        })
    }

    if(userId!==organization.admin){
        return res.status(403).json({
            message:"you are not the admin"
        })
    }

    ORGANIZATIONS=ORGANIZATIONS.filter(org=>org.id!==organization_id);

    res.json({
        message:"Organization deleted!",
        id:organization_id
    })
})

app.post("/add-member-to-organization", authmiddleware, (req, res) => {
    const userId = req.userId;
    const organization_id = parseInt(req.body.organization_id);
    const member_username = req.body.member_username;

    const organization = ORGANIZATIONS.find(org => org.id === organization_id);
    if (!organization || userId != organization.admin) {
        res.status(403).json({
            message: "either there is no organization or you are not admin!"
        })
        return;
    }

    const validMember = USERS.find(u => u.username === member_username);
    if (!validMember) {
        res.status(403).json({
            message: "not a valid user"
        })
        return;
    }

    organization.member.push(validMember.id);
    res.json({
        message: "new member added"
    })
})

app.delete("/members", authmiddleware, (req, res) => {
    const userId = req.userId;
    const organization_id = parseInt(req.body.organization_id);
    const member_username = req.body.member_username;

    const organization = ORGANIZATIONS.find(org => org.id === organization_id);
    if (!organization || userId !== organization.admin) {
        res.status(403).json({
            message: "either there is no organization or you are not admin!"
        })
        return;
    }

    const validMember = USERS.find(u => u.username === member_username);
    if (!validMember) {
        res.status(403).json({
            message: "not a valid user"
        })
        return;
    }

    organization.member = organization.member.filter(user => user !== validMember.id);
    res.json({
        message: "member removed"
    })


})

app.post("/organizations/:orgId/board", authmiddleware, (req, res) => {
    const userId = req.userId;
    const organization_id = parseInt(req.params.orgId);
    const organization = ORGANIZATIONS.find(org => org.id === organization_id);
    if (!organization) {
        res.status(403).json({
            message: "no such organization!"
        })
        return;
    }

    if (userId !== organization.admin) {
        res.status(403).json({
            message: "you are not the admin!"
        })
        return;
    }

    BOARDS.push({
        id: BOARDS_ID++,
        name: req.body.title,
        orgId: organization_id,
    })

    res.json({
        message: "board created",
        id: BOARDS_ID - 1
    })
})

app.get("/organizations/:orgId/board", authmiddleware, (req, res) => {
    const userId = req.userId;
    const organization_id = parseInt(req.params.orgId);
    const organization = ORGANIZATIONS.find(org => org.id === organization_id);
    if (!organization) {
        res.status(403).json({
            message: "no such organization!"
        })
        return;
    }

    const isAdmin = organization.admin === userId;
    const isMember = organization.member.includes(userId);

    if (!isAdmin && !isMember) {
        res.status(403).json({
            message: "you are not a member of this organization"
        })
        return;
    }

    const boards = BOARDS.filter((brd) => {
        return brd.orgId === organization_id;
    })

    res.json({
        boards: boards.map(brd => ({ id: brd.id, title: brd.name }))
    })
})

app.get("/boards/:boardId", authmiddleware, (req,res)=>{
    const userId = req.userId;
    const board_id = parseInt(req.params.boardId);
    const board = BOARDS.find(brd=>brd.id===board_id);

    if(!board){
        return res.status(404).json({
            message:"there is no such board",
        })
    }

    const organization = ORGANIZATIONS.find(org=>org.id===board.orgId)
    if(!organization){
        return res.status(403).json({
            message:"the organization for this board no longer exists",
        })
    }

    const isAdmin = organization.admin === userId;
    const isMember = organization.member.includes(userId);

    if (!isAdmin && !isMember) {
        return res.status(403).json({
            message: "you are not a member of this organization"
        });
    }

    const boardIssues = ISSUES
        .filter(iss => iss.boardId === board_id)
        .map(iss => ({ id: iss.id, title: iss.title, status: iss.status }));

    res.json({
        id: board.id,
        title: board.name,
        issues: boardIssues
    })
})

app.delete("/organizations/:orgId/board/:boardId", authmiddleware, (req,res)=>{
    const userId = req.userId;
    const organization_id = parseInt(req.params.orgId);
    const board_id = parseInt(req.params.boardId);


    const organization = ORGANIZATIONS.find(org=>org.id===organization_id);
    if(!organization){
        return res.status(403).json({
            message:"no such organization!"
        })
    }

    const board = BOARDS.find(brd=>brd.id===board_id);
    if(!board || board.orgId !== organization_id){
        return res.status(403).json({
            message:"there is no such board"
        })
    }

    if(userId!==organization.admin){
        return res.status(403).json({
            message:"you are not the admin"
        })
    }


    BOARDS=BOARDS.filter(brd=>brd.id!==board_id);

    res.json({
        message:"board deleted!",
        id:board_id
    })
})

app.post("/organizations/:orgId/boards/:boardId/issues", authmiddleware, (req, res) => {
    const userId = req.userId;
    const organization_id = parseInt(req.params.orgId);
    const board_id = parseInt(req.params.boardId);

    const organization = ORGANIZATIONS.find(org => org.id === organization_id);
    if (!organization) {
        res.status(403).json({
            message: "no such organization!"
        })
        return;
    }

    const board = BOARDS.find(brd => brd.id === board_id);
    if (!board || board.orgId !== organization_id) {
        res.status(403).json({
            message: "there is no such board"
        })
        return;
    }

    if (userId !== organization.admin) {
        res.status(403).json({
            message: "you are not the admin"
        })
        return;
    }

    const title = req.body.title;
    if (!title) {
        res.status(403).json({
            message: "issue title is required"
        })
        return;
    }

    ISSUES.push({
        id: ISSUES_ID++,
        boardId: board_id,
        title: title,
        status: req.body.status || "todo",
    })

    res.json({
        message: "issue created",
        id: ISSUES_ID - 1
    })

})

app.put("/organizations/:orgId/boards/:boardId/issues/:issueId", authmiddleware, (req,res)=>{
    const userId = req.userId;
    const organization_id = parseInt(req.params.orgId);
    const board_id = parseInt(req.params.boardId);
    const issue_id = parseInt(req.params.issueId);

    const organization = ORGANIZATIONS.find(org=>org.id===organization_id);
    if(!organization){
        return res.status(403).json({
            message:"no such organization!"
        })
    }

    const board = BOARDS.find(brd=>brd.id===board_id);
    if(!board || board.orgId !== organization_id){
        return res.status(403).json({
            message:"there is no such board"
        })
    }

    if(userId!==organization.admin){
        return res.status(403).json({
            message:"you are not the admin"
        })
    }

    const issue = ISSUES.find(iss=>iss.id===issue_id);
    if(!issue || issue.boardId !== board_id){
        return res.status(404).json({
            message:"there is no such issue"
        })
    }

    const newStatus = req.body.status;
    if(!newStatus || !VALID_STATUS.includes(newStatus)){
        return res.status(400).json({
            message:"status must be one of: " + VALID_STATUS.join(", ")
        })
    }

    issue.status = newStatus;

    res.json({
        message:"issue status updated",
        id:issue.id,
        status:issue.status
    })
})

app.delete("/organizations/:orgId/boards/:boardId/issues/:issueId", authmiddleware, (req,res)=>{
    const userId = req.userId;
    const organization_id = parseInt(req.params.orgId);
    const board_id = parseInt(req.params.boardId);
    const issue_id = parseInt(req.params.issueId);

    const organization = ORGANIZATIONS.find(org=>org.id===organization_id);
    if(!organization){
        return res.status(403).json({
            message:"no such organization!"
        })
    }

    const board = BOARDS.find(brd=>brd.id===board_id);
    if(!board || board.orgId !== organization_id){
        return res.status(403).json({
            message:"there is no such board"
        })
    }

    if(userId!==organization.admin){
        return res.status(403).json({
            message:"you are not the admin"
        })
    }

    const issue = ISSUES.find(iss=>iss.id===issue_id);
    if(!issue || issue.boardId !== board_id){
        return res.status(404).json({
            message:"there is no such issue"
        })
    }

    ISSUES = ISSUES.filter(iss => iss.id !== issue_id)

    res.json({
        message:"issue deleted!",
        id:issue_id
    })
})

app.listen(3000);