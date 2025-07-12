import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MailService } from "./mail.service";
import { EmailTokenService } from "./email-token.service";
import { EmailToken } from "../database/entities/email-token.entity";
import { JwtModule } from "@nestjs/jwt";

@Module({
    imports: [
        TypeOrmModule.forFeature([EmailToken]),
        JwtModule
    ],
    providers: [MailService, EmailTokenService],
    exports: [MailService, EmailTokenService]
})
export class MailModule {}