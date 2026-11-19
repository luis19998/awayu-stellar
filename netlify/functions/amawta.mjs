import { handleAmawta } from "../../web/server/ai.js";

export default async (req) => handleAmawta(req);
export const config = { path: "/api/amawta" };
