import { Request, Response, Router } from "express";
import { asyncHandler } from "../../Helper.js";
import { handleGetUserPublicInfo } from "../../controller/UserController.js";

export const profileRoutes = Router();

profileRoutes.get(
    "/profiles/:userId",
    asyncHandler(async (req: Request, res: Response)=> {
        const params = req.params;
        const userService = req.userService;
        const response = await handleGetUserPublicInfo(userService, params);
        res.json(response);
    })
)