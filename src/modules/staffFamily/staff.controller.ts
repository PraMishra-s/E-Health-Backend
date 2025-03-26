import { User } from "../../common/@types";
import { ErrorCode } from "../../common/enums/error-code.enum";
import { UnauthorizedException } from "../../common/utils/catch-errors";
import { staffFamilySchema, updateStaffFamilySchema } from "../../common/validators/staffFamily.validator";
import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { StaffService } from "./staff.service";
import { Request, Response } from "express";

export class StaffController{
    private staffService

    constructor(staffService: StaffService){
        this.staffService = staffService
    }
    public  createFamilyMember = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req.user as User)?.id;
        const userType = (req.user as User)?.userType
        if(!userId || userType!== 'HA'){
            throw new UnauthorizedException(
                "Only HA is authorized to do this",
                 ErrorCode.ACCESS_UNAUTHORIZED
            )
        }
        const validatedData = staffFamilySchema.parse(req.body);

        const familyMember = await this.staffService.createFamilyMember(validatedData);

        res.status(HTTPSTATUS.CREATED).json({ message: "Family member added successfully", familyMember });
    });


    public  getFamilyMembers = asyncHandler(async (req: Request, res: Response) => {
        const { staff_id } = req.params;
        const familyMembers = await this.staffService.getFamilyMembers(staff_id);

        res.status(HTTPSTATUS.OK).json({ message: "Family members retrieved", familyMembers });
    });
    public  getAllFamilyMembers = asyncHandler(async (req: Request, res: Response) => {
        const { staff_id } = req.params;
        const familyMembers = await this.staffService.getAllFamilyMembers(staff_id);

        res.status(HTTPSTATUS.OK).json({ message: "Family members retrieved", familyMembers });
    });

    public  updateFamilyMember = asyncHandler(async (req: Request, res: Response) => {
        const  id  = req.params.id;
        const validatedData = updateStaffFamilySchema.parse(req.body);

        const updatedMember = await this.staffService.updateFamilyMember(id, validatedData);

        res.status(HTTPSTATUS.OK).json({ message: "Family member updated", updatedMember });
    });

    // 🟢 Soft delete family member
    public  deleteFamilyMember = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        await this.staffService.deleteFamilyMember(id);

        res.status(HTTPSTATUS.OK).json({ message: "Family member removed successfully" });
    });

    public hardDeleteFamilyMember= asyncHandler(async (req: Request, res: Response)=>{
        const { id } = req.params;
        await this.staffService.hardDeleteFamilyMember(id);
        return res.status(HTTPSTATUS.OK).json({
            message: "Family member permanently deleted."
        });
    }) 
    

}