import { Router } from 'express';
import { createPersonalInfo, getAllPersonalInfo, getPersonalInfo } from '../controllers/personalInfo.controller';

const router = Router();


router.post("/record", createPersonalInfo);
router.get("/:id", getPersonalInfo);
router.get("/", getAllPersonalInfo);


export default router;