import { Request, Response, Router } from "express";
import { asyncHandler } from "../../Helper.js";
import { validateBody, validateQuery } from "../../middleware/Validators.js";
import { ConfirmPhotoUploadBodySchema, GetPhotoUploadUrlQuerySchema, UpdateUserBodySchema } from "./UserValidationSchemas.js";
import { handleConfirmPhotoUploadUrl, handleDeleteProfilePhoto, handleDeleteUser, 
    handleGetPhotoUploadUrl, handleGetUser, handleGetUserPublicInfo, handlePutUser 
} from "../../controller/UserController.js";

export const userRouter = Router();


userRouter.route("/user")
    .put(
        validateBody(UpdateUserBodySchema),
        asyncHandler(async (req: Request, res: Response)=> {
        const userId = req.userId;
        const body = req.validatedBody!;
        const service = req.userService;

        const response = await handlePutUser(service, { userId, ...body });

        res.status(200).json(response);
    }))
    .delete(
        asyncHandler(async (req: Request, res: Response)=> {
            const userId = req.userId;
            const service = req.userService;

            await handleDeleteUser(service, { userId });

            res.sendStatus(200);
        }))
    .get(
        asyncHandler(async (req: Request, res: Response)=> {
            const userId = req.userId;
            const userService = req.userService;

            const response = await handleGetUser(userService, { userId });

            res.json(response);
        }))

userRouter.get("/user/photo-upload-url",
    validateQuery(GetPhotoUploadUrlQuerySchema),
    asyncHandler(async (req: Request, res: Response) => {
        const query = req.validatedQuery!!;
        const userService = req.userService;

        const response = await handleGetPhotoUploadUrl(userService,query);

        res.json(response);
    })
)

userRouter.put("/user/photo-upload-confirm",
    validateBody(ConfirmPhotoUploadBodySchema),
    asyncHandler(async (req: Request, res: Response) => {
        const body = req.validatedBody!!;
        const userId = req.userId;
        const userService = req.userService;

        const response = await handleConfirmPhotoUploadUrl(userService, { userId, ...body });

        res.status(201).json(response)
    })
)


userRouter.delete("/user/profile-photo",
    asyncHandler(async (req: Request, res: Response) => {
        const userId = req.userId;
        const userService = req.userService;

        await handleDeleteProfilePhoto(userService, { userId });

        res.sendStatus(204)
    })
)


export const noauthUserRoutes = Router();

noauthUserRoutes.get("/users/:userId",asyncHandler(async (req: Request, res: Response)=> {
    const params = req.params;
    const userService = req.userService;

    const response = await handleGetUserPublicInfo(userService, params);

    res.json(response);
}))