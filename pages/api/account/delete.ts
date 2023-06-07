import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isOrg, orgName, orgDesc } = req.body;
  const session = await getServerSession(req, res, authOptions);

  if (session) {
    try {
      const deleteUser = await prisma.user.delete({
        where: {
          id: session.user?.id,
        },
      });
      res.status(204).send({ message: "Account successfully deleted" });
    } catch (error) {
      res.status(405).send(error);
    }
  } else {
    res.status(401).send({ message: "Unauthorized" });
  }
}
