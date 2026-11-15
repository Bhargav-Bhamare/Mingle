import {Router} from "express";

const router = Router();

router.route("/login");
router.route("register");
router.route("/add_to_activy");
router.route("/get_all_activities");

export default router;