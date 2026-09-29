require("dotenv").config()
const mongoose=require("mongoose");
mongoose.connect(process.env.MONGOOSE_ID);

const userSchema = mongoose.Schema({
    username:String,
    password:String
})

const organizationSchema = mongoose.Schema({
    title:String,
    description:String,
    admin: mongoose.Types.ObjectId,
    members:[mongoose.Types.ObjectId]
})

const boardsSchema = mongoose.Schema({
    name:String,
    orgId:mongoose.Types.ObjectId
})
const VALID_STATUS = ["todo", "in-progress", "done"];
const issuesSchema = mongoose.Schema({
    boardId:mongoose.Types.ObjectId,
    title:String,
    status: {
        type: String,
        enum: VALID_STATUS,
        default: "todo"
    }
})



const organizationModel=mongoose.model("organizations",organizationSchema)
const userModel=mongoose.model("users",userSchema)
const boardsModel=mongoose.model("boards",boardsSchema)
const issuesModel=mongoose.model("issues",issuesSchema)

module.exports={
    organizationModel,
    userModel,
    boardsModel,
    issuesModel,
    VALID_STATUS
}