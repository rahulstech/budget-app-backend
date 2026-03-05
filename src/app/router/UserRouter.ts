import { Request, Response, Router } from "express";
import { asyncHandler } from "../Helper.js";
import { validateBody, validateQuery } from "../middleware/Validators.js";
import { ConfirmPhotoUploadUrlQuerySchema, CreateUserBodySchema, GetPhotoUploadUrlQuerySchema, UpdateUserBodySchema } from "../middleware/UserValidationSchemas.js";
import { handleConfirmPhotoUploadUrl, handleDeleteUser, handleGetPhotoUploadUrl, handleGetUser, handleGetUserPublicInfo, handlePatchUser, handlePostUser } from "../controller/UserController.js";

export const userRouter = Router();

userRouter.post("/user", 
    validateBody(CreateUserBodySchema),
    asyncHandler(async (req: Request, res: Response)=> {
        const userId = req.userId;
        const body = req.validatedBody!;
        const userService = req.userService;

        const response = await handlePostUser(userService, { userId, ...body });

        res.status(201).json(response);
    }));

userRouter.patch("/user",
    validateBody(UpdateUserBodySchema),
    asyncHandler(async (req: Request, res: Response)=> {
        const userId = req.userId;
        const body = req.validatedBody!;
        const service = req.userService;

        await handlePatchUser(service, { userId, ...body });

        res.sendStatus(200);
    }))

userRouter.delete("/user", 
    asyncHandler(async (req: Request, res: Response)=> {
        const userId = req.userId;
        const service = req.userService;

        await handleDeleteUser(service, { userId });

        res.sendStatus(200);
    }))


userRouter.get("/user",asyncHandler(async (req: Request, res: Response)=> {
    const { userId } = req.params;
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
    validateQuery(ConfirmPhotoUploadUrlQuerySchema),
    asyncHandler(async (req: Request, res: Response) => {
        const query = req.validatedQuery!!;
        const userId = req.userId;
        const userService = req.userService;

        const response = await handleConfirmPhotoUploadUrl(userService, { userId, ...query });

        res.status(201).json(response)
    })
)

userRouter.get("/users/:userId",asyncHandler(async (req: Request, res: Response)=> {
    const params = req.params;
    const userService = req.userService;

    const response = await handleGetUserPublicInfo(userService, params);

    res.json(response);
}))