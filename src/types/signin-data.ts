import { User } from "src/user/entities/user.entity";

export interface SignInData {
    access_token: string,
    user: User
}