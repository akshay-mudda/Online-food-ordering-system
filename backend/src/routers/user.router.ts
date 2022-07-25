import {Router} from 'express';
import { sample_users } from '../data';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { User, UserModel } from '../models/user.model';
import { HTTP_UNAUTHORIZED, HTTP_BAD_REQUEST } from '../constants/http_status';
import bcrypt from 'bcryptjs';
import { Document, Types } from 'mongoose';
const router = Router();

router.get("/seed", asyncHandler(
  async (req, res) => {
     const usersCount = await UserModel.countDocuments();
     if(usersCount> 0){
       res.send("Seed is already done!");
       return;
     }
 
     await UserModel.create(sample_users);
     res.send("Seed Is Done!");
 }
 ))

router.post("/login", asyncHandler(
  async (req, res) => {
    const {email, password} = req.body;
    console.log("req body", req.body, email, password);
    let getUser;
    const user = await UserModel.findOne({
      email : req.body.email
    }).then(async user => {
        if (!user) {
          console.log("user if", user, email, req.body.password, password);
          res.status(HTTP_UNAUTHORIZED).send("Authentication failed");
        }
        else{
          const validPassword = await bcrypt.compare(req.body.password, user.password);
          console.log("user coming else", req.body.password, user.password, validPassword);
          let name = user.name;
          if (validPassword) {
            res.status(200).json({ message: "Valid password", name });
            res.send(generateTokenReponse(user));
          } else {
            res.status(400).json({ message: "Invalid Password" });
          }
        }
    }).catch(err => {
      if(err){
        console.log("error", err);
        res.status(500).send(err);
        
      }
    });
  }
));
  


// router.post('/register', asyncHandler(
//   async (req, res) => {
//     const {name, email, password, address} = req.body;
//     const user = await UserModel.findOne({email});
//     if(user){ 
//       res.status(HTTP_BAD_REQUEST)
//       .send('User is already exist, please login!');
//       return;
//     }

//     const encryptedPassword = await bcrypt.hash(password, 10);

//     const newUser:User = {
//       id:'',
//       name,
//       email: email.toLowerCase(),
//       password: encryptedPassword,
//       address,
//       isAdmin: false
//     }

//     const dbUser = await UserModel.create(newUser);
//     res.send(generateTokenReponse(dbUser));
//   }
// ))

  const generateTokenReponse = (user : User) => {
    console.log("user", user);
    const token = jwt.sign({
      id: user.id, email:user.email, isAdmin: user.isAdmin
    },process.env.JWT_SECRET!,{
      expiresIn:"30d"
    });
  
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      address: user.address,
      isAdmin: user.isAdmin,
      token: token
    };
  }
  
  router.post('/register', asyncHandler(
    async (req, res) => {
    const {name, email, password, address} = req.body;
    console.log("body data :"+ req.body);
    try {
      UserModel.findOne({email: email}).then(async result=>{
        console.log("Result", result);
        if(result){
          console.log("Email already registered"+result);
          res.status(400).json({
            message: `Already registered with this email- ${req.body.email}`,
          });
        }
        else{
          const encryptedPassword = await bcrypt.hash(password, 8);
          UserModel.insertMany(
          {
            //client side data
            id:'',
            name,
            email: email.toLowerCase(),
            password: encryptedPassword,
            address,
            isAdmin: false     
          }
          
          ).then(result=>{
            console.log("Result", result, res);
            res.status(200).json({
            message: `Successfully User Created- ${email}`,
          });

          })
        }
      })   
    }   
    catch (err) {
      // res.status(500).json({ message: "INTERNAL SERVER ERROR" });
      res.status(500).send(err);
    }
  }))

  export default router;