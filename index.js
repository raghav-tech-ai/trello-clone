require("dotenv").config()
const express = require("express");
const jwt = require("jsonwebtoken");
const {authmiddleware}  = require("./middleware")

let USERS_ID=1;
let ORGANIZATIONS_ID=1;
let MEMBERS_ID=1;
let BOARDS_ID=1;

const USERS =[];

const ORGANIZATIONS =[];

const MEMBERS =[];

const BOARDS =[];




const app = express();
app.use(express.json());

app.post("/signup",(req,res)=>{
    const username = req.body.username;
    const password = req.body.password;

    

    const userExists = USERS.find(u=>u.username===username);
    if(userExists){
        res.status(411).json({
            message:"user with this username already exists"
        })
        return;
    }

    if(!username || !password){
        res.status(400).json({
            message:"username and password are required!"
        })
        return;
    }

    USERS.push({
        id:USERS_ID++,
        username:username,
        password:password
    })

    res.json({
        message:"you have signed up successfully"
    })
    
})

app.post("/signin",(req,res)=>{
    const username = req.body.username;
    const password = req.body.password;

    const userExist = USERS.find(u=>u.username===username && u.password===password);
    if(!userExist){
        res.status(411).json({
            message:"Incorrect credentials"
        })
        return;
    }

    const token = jwt.sign({ userId: userExist.id }, process.env.JWT_SECRET);

    res.json({
        token:token
    })
})

app.get("/dashboard", authmiddleware, (req,res)=>{
    const userId = req.userId;
    const userOrg = ORGANIZATIONS.filter(org=>org.admin===userId || org.member.includes(userId));

    const result = userOrg.map(org=>{
        const role = org.admin === userId ? "admin" : "member"; 
        return{
            id:org.id,
            title:org.title,
            description:org.description,
            role:role
        }
    });

    res.json({
        organization:result
    })
})

app.post("/organization", authmiddleware, (req,res)=>{
    const userId = req.userId;
    ORGANIZATIONS.push({
        id:ORGANIZATIONS_ID++,
        title:req.body.title,
        description:req.body.description,
        admin:userId,
        member:[]
    }) 
    res.json({
        message:"org created",
        id:ORGANIZATIONS_ID -1
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

app.get("/boards/:boardId",authmiddleware,(req,res)=>{
    const userId = req.userId;
    const board_id = parseInt(req.params.boardId);
    const board = BOARDS.find(brd=>brd.id===board_id);
    if(!board ){
        res.status(403).json({
            message:"there is no such board",
        })
        return;
    }
    const valid_boards = ORGANIZATIONS.find(org=>org.id ===board.orgId);
    if(!valid_boards){
        res.status(403).json({
            message:"there is no such board",
        })
        return;
    }
    const isAdmin = valid_boards.admin === userId;
    const isMember = valid_boards.member.includes(userId);

    if (!isAdmin && !isMember) {
        return res.status(403).json({
            message: "you are not a member of this organization"
        });
    }

    res.json({
        id:board.id,
        title:board.name
    })
})

app.post("/add-member-to-organization",authmiddleware,(req,res)=>{
    const userId = req.userId;
    const organization_id = parseInt(req.body.organization_id);
    const member_username = req.body.member_username;

    const organization=ORGANIZATIONS.find(org=>org.id===organization_id);
    if(!organization || userId!=organization.admin){
        res.status(403).json({
            message:"either there is no organization or you are not admin!"
        })
        return;
    }

    const validMember = USERS.find(u=>u.username===member_username);
    if(!validMember){
        res.status(403).json({
            message:"not a valid user"
        })
        return;
    }

    organization.member.push(validMember.id);
    res.json({
        message:"new member added"
    })
})

app.delete("/members", authmiddleware, (req,res)=>{
    const userId = req.userId;
    const organization_id = parseInt(req.body.organization_id);
    const member_username = req.body.member_username;

    const organization=ORGANIZATIONS.find(org=>org.id===organization_id);
    if(!organization || userId!==organization.admin){
        res.status(403).json({
            message:"either there is no organization or you are not admin!"
        })
        return;
    }

    const validMember = USERS.find(u=>u.username===member_username);
    if(!validMember){
        res.status(403).json({
            message:"not a valid user"
        })
        return;
    }

    organization.member = organization.member.filter(user=>user !== validMember.id);
    res.json({
        message:"member removed"
    })

    
})
app.listen(3000);