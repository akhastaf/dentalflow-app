import { UserResponseDto } from "src/auth/dto/user-response.dto";

export interface SignInData {
    access_token: string,
    user: UserResponseDto
}