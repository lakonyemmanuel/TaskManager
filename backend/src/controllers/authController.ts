import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";


// REGISTER USER
export const register = async (
req: Request,
res: Response
)=>{

console.log("REGISTER ROUTE HIT");

try {

const {firstname,lastName,email,password}=req.body;


const existingUser = await prisma.user.findUnique({
where:{
email
}
});


if(existingUser){

return res.status(400).json({
message:"User already exists"
});

}


const hashedPassword = await bcrypt.hash(password,10);


const user = await prisma.user.create({

data:{
firstname,
lastName,
email,
password:hashedPassword
}

});


res.status(201).json({

message:"User created successfully",

user:{
id:user.id,
firstname:user.firstname,
lastName:user.lastName,
email:user.email
}

});


}
catch(error){

console.log(error);

res.status(500).json({
message:"Server error"
});

}

};



// LOGIN USER
export const login = async (
req: Request,
res: Response
)=>{

try{

const {email,password}=req.body;


// Find user
const user = await prisma.user.findUnique({
where:{
email
}
});


if(!user){

return res.status(401).json({
message:"Invalid email or password"
});

}


// Check password
const passwordMatch = await bcrypt.compare(
password,
user.password
);


if(!passwordMatch){

return res.status(401).json({
message:"Invalid email or password"
});

}


// Create JWT token
const token = jwt.sign(
{
id:user.id,
email:user.email
},
process.env.JWT_SECRET!,
{
expiresIn:"7d"
}
);


res.status(200).json({

message:"Login successful",

token,

user:{
id:user.id,
firstname:user.firstname,
lastName:user.lastName,
email:user.email
}

});


}
catch(error){

console.log(error);

res.status(500).json({
message:"Server error"
});

}

};