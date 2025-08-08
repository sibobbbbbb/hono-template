import { Context } from "hono";
import { sendSuccess } from "@/shared/utils/api-response";
import { UserService } from "@/modules/user/user.service";

/**
 * @class UserController
 * Handles the HTTP layer for user-related operations. It receives requests,
 * calls the appropriate service methods with request data, and formats the
 * HTTP response (success or error).
 */
export class UserController {
  constructor(private userService: UserService) {}

  /**
   * Fetches the profile of the currently authenticated user.
   */
  public getMyProfile = async (c: Context) => {
    const userId = c.get("jwtPayload").sub;

    const userProfile = await this.userService.getMyProfile(userId);

    return sendSuccess(c, 200, "Profile fetched successfully", userProfile);
  };
}
