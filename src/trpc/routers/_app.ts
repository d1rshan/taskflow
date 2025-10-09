import { db } from "@/db";
import { baseProcedure, createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  getUsers: baseProcedure.query(() => {
    return db.query.usersTable.findMany();
  }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
