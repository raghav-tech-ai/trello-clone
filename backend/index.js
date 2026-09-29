require("dotenv").config()
const express = require("express");
const jwt = require("jsonwebtoken");
const { authmiddleware } = require("./middleware")
const {userModel, organizationModel,boardsModel,issuesModel,VALID_STATUS} = require("./models")


const app = express();

app.use(express.json());

app.post("/signup",async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;



    const userExists = await userModel.findOne({
        username:username,
    });
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

    const newUser = await userModel.create({
        username:username,
        password:password
    });

    res.json({
        id:newUser._id,
        message: "you have signed up successfully"
    })

})

app.post("/signin", async(req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const userExists = await userModel.findOne({
        username:username,
        password:password
    });
    if (!userExists) {
        res.status(411).json({
            message: "Incorrect credentials"
        })
        return;
    }

    const token = jwt.sign({ userId: userExists.id }, process.env.JWT_SECRET);

    res.json({
        token: token
    })
})

app.get("/dashboard", authmiddleware, async (req, res) => {
    const userId = req.userId;

    const userOrgs = await organizationModel.find({
        $or: [
            { admin: userId },
            { members: userId }
        ]
    });

    const result = userOrgs.map(org => {
        const role = org.admin.toString() === userId ? "admin" : "member";
        return {
            id: org._id,
            title: org.title,
            description: org.description,
            role: role
        }
    });

    res.json({
        organization: result
    })
})

app.post("/organization", authmiddleware, async(req, res) => {
    const userId = req.userId;
    const neworganization = await organizationModel.create({
        title:req.body.title,
        description: req.body.description,
        admin: userId,
        members: []
    });
    
    res.json({
        message: "org created",
        id: neworganization._id
    })
})

app.get("/organizations/:orgId", authmiddleware, async(req, res) => {
    const userId = req.userId;
    const organization_id = req.params.orgId;

    const organization = await organizationModel.findOne({
        _id:organization_id
    })
    if (!organization) {
        return res.status(404).json({
            message: "there is no such organization"
        });
    }

    const isAdmin = organization.admin.toString() === userId;
    const isMember = organization.members.some(m => m.toString() === userId);

    if (!isAdmin && !isMember) {
        return res.status(403).json({
            message: "you are not a member of this organization"
        });
    }
    const members= await Promise.all(
        organization.members.map(async(memberId)=>{
            const users=await userModel.findOne({
                _id:memberId
            })
            return {
                id:users._id,
                username:users.username
            };
        })
    )

    res.json({
        organization: {
            id: organization._id,
            title: organization.title,
            role: isAdmin ? "admin" : "member",
            members: members
        }
    });
})

app.delete("/organizations/:orgId", authmiddleware, async(req,res)=>{
    const userId = req.userId;
    const organization_id = req.params.orgId;

    const organization = await organizationModel.findOne({
        _id:organization_id
    })
    if(!organization){
        return res.status(403).json({
            message:"no such organization!"
        })
    }

    if(userId!==organization.admin.toString()){
        return res.status(403).json({
            message:"you are not the admin"
        })
    }

    await organizationModel.deleteOne({
        _id:organization_id
    })

    res.json({
        message:"Organization deleted!",
        id:organization_id
    })
})

app.post("/add-member-to-organization", authmiddleware, async(req, res) => {
    const userId = req.userId;
    const organization_id = req.body.organization_id;
    const member_username = req.body.member_username;

    const organization = await organizationModel.findOne({
        _id:organization_id
    })
    if (!organization || userId != organization.admin.toString()) {
        res.status(403).json({
            message: "either there is no organization or you are not admin!"
        })
        return;
    }

    const validMember = await userModel.findOne({
        username:member_username
    })
    if (!validMember) {
        res.status(403).json({
            message: "not a valid user"
        })
        return;
    }

    await organizationModel.updateOne({_id:organization_id},{$push:{"members":validMember._id}})
    res.json({
        message: "new member added"
    })
})

app.delete("/members", authmiddleware, async(req, res) => {
    const userId = req.userId;
    const organization_id = req.body.organization_id;
    const member_username = req.body.member_username;

    const organization = await organizationModel.findOne({
        _id:organization_id
    })
    if (!organization || userId !== organization.admin.toString()) {
        res.status(403).json({
            message: "either there is no organization or you are not admin!"
        })
        return;
    }

    const validMember = await userModel.findOne({
        username:member_username
    })
    if (!validMember) {
        res.status(403).json({
            message: "not a valid user"
        })
        return;
    }

    await organizationModel.updateOne({
        _id:organization_id
    },{
        $pull:{
            "members":validMember._id
        }
    })
    res.json({
        message: "member removed"
    })


})

app.post("/organizations/:orgId/boards", authmiddleware, async(req, res) => {
    const userId = req.userId;
    const organization_id = req.params.orgId;
    const organization = await organizationModel.findOne({
        _id:organization_id
    })
    if (!organization) {
        res.status(403).json({
            message: "no such organization!"
        })
        return;
    }

    if (userId !== organization.admin.toString()) {
        res.status(403).json({
            message: "you are not the admin!"
        })
        return;
    }

    const newboard = await boardsModel.create({
        name:req.body.title,
        orgId:organization_id
    
    });


    res.json({
        message: "board created",
        id: newboard._id
    })
})

app.get("/organizations/:orgId/boards", authmiddleware, async(req, res) => {
    const userId = req.userId;
    const organization_id = req.params.orgId;
    const organization = await organizationModel.findOne({
        _id:organization_id
    })
    if (!organization) {
        res.status(403).json({
            message: "no such organization!"
        })
        return;
    }

    const isAdmin = organization.admin.toString() === userId;
    const isMember = organization.members.some(m => m.toString() === userId);

    if (!isAdmin && !isMember) {
        res.status(403).json({
            message: "you are not a member of this organization"
        })
        return;
    }

    const boards=await boardsModel.find({
        orgId:organization_id
    })
    
    res.json({
            boards: boards.map(brd => ({
                id: brd._id,
                title: brd.name
            }))
    });
})

app.get("/boards/:boardId", authmiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const board_id = req.params.boardId;

        const board = await boardsModel.findOne({ _id: board_id });
        if (!board) {
            return res.status(404).json({
                message: "there is no such board"
            });
        }

        const organization = await organizationModel.findOne({ _id: board.orgId });
        if (!organization) {
            return res.status(404).json({
                message: "the organization for this board no longer exists"
            });
        }

        const isAdmin = organization.admin.toString() === userId;
        const isMember = organization.members.some(m => m.toString() === userId);

        if (!isAdmin && !isMember) {
            return res.status(403).json({
                message: "you are not a member of this organization"
            });
        }

        const issues = await issuesModel.find({ boardId: board_id });

        res.json({
            id: board._id,
            title: board.name,
            role: isAdmin ? "admin" : "member",
            issues: issues.map(iss => ({
                id: iss._id,
                title: iss.title,
                status: iss.status
            }))
        });
    } catch (err) {
        res.status(400).json({
            message: "invalid board id"
        });
    }
})

app.delete("/organizations/:orgId/boards/:boardId", authmiddleware, async(req,res)=>{
    const userId = req.userId;
    const organization_id = req.params.orgId;
    const board_id = req.params.boardId;


    const organization = await organizationModel.findOne({
        _id:organization_id
    })
    if(!organization){
        return res.status(403).json({
            message:"no such organization!"
        })
    }

    const board = await boardsModel.findOne({ _id: board_id });
    if(!board || board.orgId.toString() !== organization_id){
        return res.status(403).json({
            message:"there is no such board"
        })
    }

    if(userId!==organization.admin.toString()){
        return res.status(403).json({
            message:"you are not the admin"
        })
    }

    await boardsModel.deleteOne({ _id: board_id });

    res.json({
        message: "board deleted!",
        id: board_id
    });

    
})

app.post("/organizations/:orgId/boards/:boardId/issues", authmiddleware, async(req, res) => {
    const userId = req.userId;
    const organization_id = req.params.orgId;
    const board_id = req.params.boardId;

    const organization = await organizationModel.findOne({
        _id:organization_id
    })
    if (!organization) {
        res.status(403).json({
            message: "no such organization!"
        })
        return;
    }

    const board = await boardsModel.findOne({ _id: board_id });
    if (!board || board.orgId.toString() !== organization_id) {
        res.status(403).json({
            message: "there is no such board"
        })
        return;
    }

    if (userId !== organization.admin.toString()) {
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

    const newIssue=await issuesModel.create({
        boardId: board_id,
        title: title,
        status: req.body.status || "todo",
    })

    res.json({
        message: "issue created",
        id: newIssue._id
    })

})

app.put("/organizations/:orgId/boards/:boardId/issues/:issueId", authmiddleware, async(req,res)=>{
    const userId = req.userId;
    const organization_id = req.params.orgId;
    const board_id = req.params.boardId;
    const issue_id = req.params.issueId;

    const organization = await organizationModel.findOne({
        _id:organization_id
    })
    if(!organization){
        return res.status(403).json({
            message:"no such organization!"
        })
    }

    const board = await boardsModel.findOne({ _id: board_id });
    if(!board || board.orgId.toString() !== organization_id){
        return res.status(403).json({
            message:"there is no such board"
        })
    }

    if(userId!==organization.admin.toString()){
        return res.status(403).json({
            message:"you are not the admin"
        })
    }


    const issue = await issuesModel.findOne({
        _id:issue_id
    })
    if(!issue || issue.boardId.toString() !== board_id){
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
    await issue.save();

    res.json({
        message:"issue status updated",
        id:issue.id,
        status:issue.status
    })
})

app.delete("/organizations/:orgId/boards/:boardId/issues/:issueId", authmiddleware, async(req,res)=>{
    const userId = req.userId;
    const organization_id = req.params.orgId;
    const board_id = req.params.boardId;
    const issue_id = req.params.issueId;

    const organization = await organizationModel.findOne({
        _id:organization_id
    })
    if(!organization){
        return res.status(403).json({
            message:"no such organization!"
        })
    }

    const board = await boardsModel.findOne({ _id: board_id });
    if(!board || board.orgId.toString() !== organization_id){
        return res.status(403).json({
            message:"there is no such board"
        })
    }

    if(userId!==organization.admin.toString()){
        return res.status(403).json({
            message:"you are not the admin"
        })
    }

    const issue = await issuesModel.findOne({
        _id:issue_id
    })
    if(!issue || issue.boardId.toString() !== board_id){
        return res.status(404).json({
            message:"there is no such issue"
        })
    }

    await issuesModel.deleteOne({ _id: issue_id });

    res.json({
        message: "issue deleted!",
        id: board_id
    });
})

app.listen(3000,()=>{
    console.log("server running on port 3000")
});