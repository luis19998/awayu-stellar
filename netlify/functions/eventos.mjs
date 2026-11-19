import { handleEvent } from "../../web/server/notify.js";

export default async (req) => handleEvent(req);
export const config = { path: "/api/eventos" };
