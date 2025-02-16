import { User } from "../../common/@types";
import { UnauthorizedException } from "../../common/utils/catch-errors";
import { changePasswordSchema, updateUserSchema } from "../../common/validators/user.validator";
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
    public changePassword = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req.user as User)?.id;
        if (!userId) {
            throw new UnauthorizedException("Unauthorized access.");
        }

        // Validate request body using Zod schema
        const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

        await this.userService.changePassword(userId, currentPassword, newPassword);

        return res.status(HTTPSTATUS.OK).json({
            message: "Password changed successfully.",
        });
    });
}