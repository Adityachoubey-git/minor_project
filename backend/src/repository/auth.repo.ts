



import { hashpass } from "../controllers/auth.controllers";
import prisma from "../db/db";
import ErrorHandler from "../middlewares/error";
import { Role } from "@prisma/client";







//Create User
export async function createUser(
  name: string,
  email: string,
  IDnumber:string,
  role:Role,

  password: string,
  emailverificationCode: string,

  verificationCodeExpires: string
) {
  try {
    const user = await prisma.user.create({
      data: {
        IDnumber:IDnumber,
        email: email,
        password: password,
        role: role,
        name: name,
        emailverificationCode: emailverificationCode,
        verificationCodeExpire: verificationCodeExpires,
      },
    });

    return user;
  } catch (error) {
    console.error("Error creating supervisor:", error);
    throw new ErrorHandler("Error creating supervisor", 500);
  }
}

//email exists or not
export async function userEmailExists(email: string) {
  const user = await prisma.user.findFirst({ where: { email: email } });
  if (!user) {
    console.log("user not found");
    return null;
  }
  return {
    ...user,
  };
}

//userId exists or not 
export async function userIdExists(user_id: number) {
  const user = await prisma.user.findFirst({ where: { id: user_id }, select: {
    id:true,
    name:true,
    email:true,
    role:true,
    verificationCodeExpire:true,
    emailverificationCode:true,
    emailverified:true,
    
      }
    })
  if (!user) return null;
  const {
  
    ...rest     
  } = user;

  return {
    ...rest,
    
  };
}

//find admin
export async function findAdmin() {
  return await prisma.user.findMany({ where: { role: "ADMIN" } });
}

//create admin
export async function createAdmin(
  name: string,
  email: string,
  pass: string,
  Idnumber:string
) {
  const password = await hashpass(pass);

  const adminUser = await prisma.user.create({
    data: {
      IDnumber:Idnumber,
      email: email,
      password: password,
      role: "ADMIN",
      name :name   ,
      emailverificationCode: "",
      verificationCodeExpire: "",
      emailverified: true,
    },
  });

  return adminUser;
}

