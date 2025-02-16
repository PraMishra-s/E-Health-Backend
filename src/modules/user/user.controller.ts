import { User } from "../../common/@types";
import { updateUserSchema } from "../../common/validators/user.validator";
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
         console.log(userId)
        if (!userId) {
            return res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
        }

        const validatedData = updateUserSchema.parse(req.body); // Validate input
        const updatedUser = await this.userService.updateUser(userId, validatedData);

        return res.status(HTTPSTATUS.OK).json({
            message: "User profile updated successfully",
            user: updatedUser,
        });
    });
}