import { UnauthorizedException } from '@nestjs/common';
// Create a Steam Strategy


import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { Strategy } from 'passport-steam';

@Injectable()
export class SteamStrategy extends PassportStrategy(Strategy, 'steam') {
	constructor(private readonly authService: AuthService) {
		super({
			returnURL: process.env.STEAM_RETURN_URL,
			realm: process.env.STEAM_REALM,
			apiKey: process.env.STEAM_API_KEY,
		});
	}

	async validate(identifier: string, profile: any) {
		let user = await this.authService.findUserBySteamId(profile.id);

		if (!user) {
			user = await this.authService.createUser({
				username: profile.displayName,
				avatar: profile.photos[0].value,
				steam: {
					id: profile.id,
					avatar: profile.photos[0].value,
				},
			});
		}

		const jwt = await this.authService.generateJwt(user);

		return { accessToken: jwt };
	}
}