import * as bcrypt from "bcrypt";
import {
  ConflictError,
  UnauthorizedError,
} from "@/shared/exceptions/api-error";
import { User } from "@/shared/models/user.model";
import { LoginRequest, RegisterRequest } from "@/modules/auth/auth.schemas";
import { UserRepository } from "@/shared/repositories/user.repository";
import {
  generateTokens,
  hashRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from "./auth.token.helper";
import { ForbiddenError } from "@/shared/exceptions/api-error";

/**
 * @class AuthService
 * Contains the core business logic for authentication. This service
 * is responsible for user registration, password verification, token generation,
 * and handling the refresh token mechanism securely.
 */
export class AuthService {
  constructor(private userRepository: UserRepository) {}

  /**
   * Registers a new user.
   */
  public async register(requestData: RegisterRequest): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(
      requestData.email
    );
    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(requestData.password, 10);
    const dataToInsert = {
      name: requestData.name,
      email: requestData.email,
      password: hashedPassword,
    };

    const newUser = await this.userRepository.create(dataToInsert);

    return newUser;
  }

  /**
   * Logs in a user and generates access and refresh tokens.
   */
  public async login(
    requestData: LoginRequest
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepository.findByEmail(requestData.email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(
      requestData.password,
      user.password
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const payload: TokenPayload = { sub: user.id, name: user.name };
    const { accessToken, refreshToken } = await generateTokens(payload);

    const hashedToken = await hashRefreshToken(refreshToken);
    await this.userRepository.updateRefreshToken(user.id, hashedToken);

    return { accessToken, refreshToken };
  }

  /**
   * Refreshes the access token using a valid refresh token.
   */
  public async refreshToken(
    providedRefreshToken: string
  ): Promise<{ accessToken: string }> {
    const payload = await verifyRefreshToken(providedRefreshToken);
    const userInDb = await this.userRepository.findById(payload.sub);

    if (!userInDb || !userInDb.refreshToken) {
      throw new ForbiddenError("Access Denied");
    }

    const isMatch = await bcrypt.compare(
      providedRefreshToken,
      userInDb.refreshToken
    );
    if (!isMatch) {
      throw new ForbiddenError("Access Denied");
    }

    const newPayload: TokenPayload = { sub: userInDb.id, name: userInDb.name };
    const { accessToken } = await generateTokens(newPayload);

    return { accessToken };
  }

  /**
   * Logs out a user by removing their refresh token.
   */
  public async logout(userId: number): Promise<void> {
    await this.userRepository.updateRefreshToken(userId, null);
  }
}
