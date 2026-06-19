import { PrismaClient } from "@prisma/client"; const db = new PrismaClient();
(async()=>{await db.user.update({where:{email:"jeff.cline@me.com"},data:{mustChangePassword:false}});await db.$disconnect();})();
