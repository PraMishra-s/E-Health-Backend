import { User } from "../../common/@types";
import { UnauthorizedException } from "../../common/utils/catch-errors";
import { emailSchema, registrationSchema } from "../../common/validators/auth.validator";
import { uuidSchema } from "../../common/validators/inventory.validator";
import { changePasswordSchema, changeUserTypeSchema, updateProfilePicSchema, updateUserSchema } from "../../common/validators/user.validator";
import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { UserService } from "./user.service"
import { Request, Response } from "express";

export class UserController{
    private userService

    constructor(userService : UserService){
        this.userService = userService
    }

    public updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
         const userId = (req.user as User)?.id;
         const sessionId = req?.sessionId!
        if (!userId) {
            return res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
        }

        const validatedData = updateUserSchema.parse(req.body); // Validate input
        const updatedUser = await this.userService.updateUser(userId, validatedData, sessionId);

        return res.status(HTTPSTATUS.OK).json({
            message: "User profile updated successfully",
            user: updatedUser,
        });
    });
    public changePassword = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req.user as User)?.id;
        if (!userId) {
            throw new UnauthorizedException("Unauthorized access.");
        }

        const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

        await this.userService.changePassword(userId, currentPassword, newPassword);

        return res.status(HTTPSTATUS.OK).json({
            message: "Password changed successfully.",
        });
    });
    public getEmail = asyncHandler(async (req: Request, res: Response) => {
        const email = emailSchema.parse(req.body.email)
        const userType = await this.userService.getEmail(email);

        return res.status(HTTPSTATUS.OK).json({
            message: "User type retrieved successfully",
            userType, 
        });
    });
    public updatePofilePic = asyncHandler(async (req: Request, res: Response) => {
         const userId = (req.user as User)?.id;
         const sessionId = req?.sessionId!
        if (!userId) {
            return res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
        }

        const validatedData = updateProfilePicSchema.parse(req.body); 
        const updatedUser = await this.userService.updateProfilePic(userId,  validatedData , sessionId);
        return res.status(HTTPSTATUS.OK).json({
            message: "User profile picture updated successfully",
            user: updatedUser,
        })
    })
    public getUsers = asyncHandler(async (req:Request, res:Response) =>{
         const userId = (req.user as User)?.id
         const userType = (req.user as User)?.userType
         if (!userId || userType != 'HA'){
            return res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
         }
         const response = await this.userService.getUsers()
         return res.status(HTTPSTATUS.OK).json({
            message: "Users Retrieved Succesfully",
            users: response
         })
    })
    public getProgrammes = asyncHandler(async (req:Request, res:Response) =>{
        const userId = (req.user as User)?.id
        if (!userId){
            throw new UnauthorizedException("Unauthorized access.")
        }
        const response = await this.userService.getProgrammes()
        return res.status(HTTPSTATUS.OK).json({
            message: "Programmes Retrieved Succesfully",
            departments: response
         })
    })
    public changeUserType = asyncHandler(async (req:Request, res:Response) =>{
        const userId = (req.user as User)?.id
        const userType = (req.user as User)?.userType
        if (!userId || userType != 'HA' && userType != 'DEAN'){
            return res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
         }
        const id = uuidSchema.parse(req.params.id)
        const { type } = changeUserTypeSchema.parse(req.body)
        const response = await this.userService.changeUserType(id, type)
        return res.status(HTTPSTATUS.OK).json({
            message: "User Type Changed Succesfully",
            users: response
         })
    })
    public getStaff = asyncHandler(async (req:Request, res:Response) =>{
        const userId = (req.user as User)?.id
        const userType = (req.user as User)?.userType
        if (!userId || userType != 'HA' && userType != 'DEAN'){
            return res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
         }
        const response = await this.userService.getStaff()
        return res.status(HTTPSTATUS.OK).json({
            message: "Staff Retrieved Succesfully",
            staff: response
         })
    })

}