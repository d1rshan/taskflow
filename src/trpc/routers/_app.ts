import { db } from "@/db";
import { createTRPCRouter, protectedProcedure } from "../init";

export const appRouter = createTRPCRouter({
  getUsers: protectedProcedure.query(({ ctx }) => {
    return db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, ctx.auth.user.id),
    });
  }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
