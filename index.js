require("dotenv").config()
const express = require("express");
const jwt = require("jsonwebtoken");
const {authmiddleware}  = require("./middleware")

let USERS_ID=1;
let ORGANIZATIONS_ID=1;
let MEMBERS_ID=1;

const USERS =[];

const ORGANIZATIONS =[];

const MEMBERS =[];




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




app.post("/board",(req,res)=>{
    
})

app.post("/issues",(req,res)=>{
    
})

app.get("/organizations", authmiddleware, (req,res)=>{

})

app.get("/board",(req,res)=>{
    
})

app.get("/issues",(req,res)=>{
    
})

app.get("/members",(req,res)=>{
    
})

app.put("/issue",(req,res)=>{
    
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
    }

    organization.member = organization.member.filter(user=>user !== validMember.id);
    res.json({
        message:"member removed"
    })

    
})
app.listen(3000);