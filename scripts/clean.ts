import { promises as fs } from "fs";

fs.rm("dist", { recursive: true, force: true });
