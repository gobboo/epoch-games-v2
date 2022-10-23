import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy } from 'passport-oauth2';
import { stringify } from 'querystring';
import { AuthService } from '../auth.service';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { DiscordUser } from '../types/discord.interface';

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord')
{
	constructor(private readonly authService: AuthService, private readonly http: HttpService) {
		super({
			authorizationURL: `https://discordapp.com/api/oauth2/authorize?${stringify({
				client_id: process.env.DISCORD_CLIENT_ID,
				redirect_uri: process.env.DISCORD_REDIRECT_URI,
				response_type: 'code',
				scope: 'identify email guilds.join',
			})}`,
			tokenURL: 'https://discordapp.com/api/oauth2/token',
			scope: 'identify email guilds.join',
			clientID: process.env.DISCORD_CLIENT_ID,
			clientSecret: process.env.DISCORD_CLIENT_SECRET,
			callbackURL: process.env.DISCORD_REDIRECT_URI
		});
	}

	async validate(accessToken: string): Promise<any> {
		const response = await this.http.get<DiscordUser>('https://discordapp.com/api/users/@me', {
			headers: { Authorization: `Bearer ${accessToken}` },
		})

		const { data } = await lastValueFrom(response);

		let user = await this.authService.findUserFromDiscordId(data);

		if (!user) {
			user = await this.UserService.createUser({
				username: data.username,
				avatar: data.avatar,
				discord: {
					id: data.id,
					avatar: data.avatar,
					discriminator: data.discriminator,
					verified: data.verified,
				},
				email: data.email
			});
		}

		const jwt = await this.authService.generateJwt(user);

		return { accessToken: jwt };
	}
}

