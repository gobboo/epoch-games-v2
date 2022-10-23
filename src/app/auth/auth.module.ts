import {
	Module,
} from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { DiscordStrategy } from './strategies/discord.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { SteamStrategy } from './strategies/steam.strategy';

@Module({
	imports: [
		JwtModule.register({
			secret: process.env.JWT_SECRET,
			signOptions: { expiresIn: '7d' },
		}),
		UserModule,
		HttpModule,
		PassportModule
	],
	providers: [
		AuthService,
		GoogleStrategy,
		DiscordStrategy,
		SteamStrategy,
		JwtStrategy
	],
	controllers: [
		AuthController,
	],
})
export class AuthModule {
}

