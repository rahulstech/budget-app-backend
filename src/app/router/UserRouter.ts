import { Request, Response, Router } from "express";
import { asyncHandler } from "../Helper.js";
import { validateBody } from "../middleware/Validators.js";
import { CreateUserBodySchema, UpdateUserBodySchema } from "../middleware/UserValidationSchemas.js";
import { handleDeleteUser, handleGetUser, handlePatchUser, handlePostUser } from "../controller/UserController.js";

export const userRouter = Router();

userRouter.post("/user", 
    validateBody(CreateUserBodySchema),
    asyncHandler(async (req: Request, res: Response)=> {
        const userId = req.userId;
        const body = req.validatedBody!;
        const userService = req.userService;

        const result = await handlePostUser(userService, { userId, ...body });

        res.status(201).json(result);
    }));

userRouter.get("/user/:userId",asyncHandler(async (req: Request, res: Response)=> {
    const { userId } = req.params;
    const userService = req.userService;

    const result = await handleGetUser(userService, { userId });

    res.json(result);
}))

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