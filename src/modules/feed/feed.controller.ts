import { User } from "../../common/@types";
import { UnauthorizedException } from "../../common/utils/catch-errors";
import { feedSchema } from "../../common/validators/feed.validator";
import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { FeedService } from "./feed.service"
import { Request, Response } from "express";

export class FeedController{
    private feedService
    constructor(feedService: FeedService){
        this.feedService = feedService
    }
    public createFeed = asyncHandler(async (req: Request, res: Response) => {
        const userType = (req.user as User)?.userType;
        const userId = (req.user as User)?.id;
        if (userType !== "HA") {
            throw new UnauthorizedException("Only HA can create feeds");  
        }
        const validatedData = feedSchema.parse(req.body);
        const newFeed = await this.feedService.createFeed(userId, validatedData);
        res.status(HTTPSTATUS.CREATED).json({ message: "Feed created successfully", feed: newFeed });
    });

    public updateFeed = asyncHandler(async (req: Request, res: Response) => {
        const userType = (req.user as User)?.userType;
        const userId = (req.user as User)?.id;
        if (userType !== "HA") {
            throw new UnauthorizedException("Only HA can update feeds");
        }
        const feedId = req.params.id;
        if(!feedId){
            throw new UnauthorizedException("Feed id is required");
        }
        const validatedData = feedSchema.parse(req.body);
        await this.feedService.updateFeed(userId, feedId, validatedData);
        res.status(HTTPSTATUS.OK).json({ message: "Feed updated successfully" });
    });

    public deleteFeed = asyncHandler(async (req: Request, res: Response) => {
        const userType = (req.user as User)?.userType;
        const userId = (req.user as User)?.id;
        if (userType !== "HA") {
            throw new UnauthorizedException("Only HA can delete feeds");
        }
        const feedId = req.params.id;
        if(!feedId){
            throw new UnauthorizedException("Feed id is required");
        }
        await this.feedService.deleteFeed(userId, feedId);
        res.status(HTTPSTATUS.OK).json({ message: "Feed deleted successfully" });
    });

    public deleteAllFeeds = asyncHandler(async (req: Request, res: Response) => {
        const userType = (req.user as User)?.userType;
        const userId = (req.user as User)?.id;
        if (userType !== "HA") {
            throw new UnauthorizedException("Only HA can delete all feeds");
        }
        await this.feedService.deleteAllFeeds(userId);
        res.status(HTTPSTATUS.OK).json({ message: "All feeds deleted successfully" });
    });

    public getFeeds = asyncHandler(async (req: Request, res: Response) => {
        const feeds = await this.feedService.getFeeds();
        res.status(HTTPSTATUS.OK).json({ message: "Feeds retrieved successfully", feeds });
    });

}