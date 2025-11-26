import { UnauthorizedException } from '@nestjs/common';
// Create a Google Strategy

// Path: src\app\auth\strategies\google.strategy.ts

// Compare this snippet from src\app\auth\strategies\google.strategy.ts:

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth2';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
	constructor(private readonly authService: AuthService) {
		super({
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: process.env.GOOGLE_CALLBACK_URL,
			scope: ['email'],
		});
	}

	async validate(accessToken: string, refreshToken: string, profile: any) {
		let user = await this.authService.findUserByEmail(profile.email);

		if (!user) {
			user = await this.authService.createUser({
				username: profile.displayName,
				email: profile.email,
				avatar: profile.picture,
				google: {
					id: profile.id,
					avatar: profile.picture
				},
			});
		}

		const jwt = await this.authService.generateJwt(user);

		return { accessToken: jwt };
	}
}