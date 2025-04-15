"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedSchema = void 0;
const zod_1 = require("zod");
exports.feedSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
    description: zod_1.z.string().trim().min(5, "Description must be at least 500 characters").max(500, "Description must be less than 500 characters"),
    image_urls: zod_1.z.array(zod_1.z.string().url("Invalid image URL")).optional(),
    video_url: zod_1.z.array(zod_1.z.string().url("Invalid video URL")).optional(),
});
