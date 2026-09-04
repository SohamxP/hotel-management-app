import { prisma } from "../prismaClient";

export async function findUserByUsername(username: string) {
  const user = await prisma.userAccount.findUnique({
    where: {
      username,
    },
    include: {
      employee: true,
    },
  });

  if (!user) {
    return undefined;
  }

  return {
    UserID: user.userId,
    EmployeeID: user.employeeId,
    Username: user.username,
    PasswordHash: user.passwordHash,
    IsActive: user.isActive ? 1 : 0,
    FirstName: user.employee.firstName,
    LastName: user.employee.lastName,
    Position: user.employee.position,
  };
}