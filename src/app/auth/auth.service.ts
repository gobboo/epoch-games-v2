import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { DiscordUser } from './types/discord.interface';
import * as jsonwebtoken from 'jsonwebtoken';
import { User, UserDocument } from '../user/model/User.schema';

@Injectable()
export class AuthService {
	constructor(private readonly UserService: UserService) { }

	async findUserFromDiscordId(userData: DiscordUser): Promise<any> {
		const user = await this.UserService.findByIdentifier('discord.id', userData.id);

		if (!user) {
			return await this.UserService.createUser({
				username: userData.username,
				avatar: userData.avatar,
				discord: {
					id: userData.id,
					avatar: userData.avatar,
					discriminator: userData.discriminator,
					verified: userData.verified,
				},
				email: userData.email
			});
		}

		return user;
	}

	async findUserById (id: string): Promise<UserDocument> {
		return await this.UserService.findByIdentifier('_id', id);
	}

	async findUserByEmail(email: string): Promise<UserDocument> {
		return await this.UserService.findByIdentifier('email', email);
	}
	
	async findUserBySteamId(steamId: string): Promise<UserDocument> {
		return await this.UserService.findByIdentifier('steam.id', steamId);
	}

	async createUser (user: Partial<User>): Promise<UserDocument> {
		return await this.UserService.createUser(user);
	}

	async generateJwt(user: UserDocument): Promise<string> {
		const payload = {
			_id: user._id,
			username: user.username
		}

		return jsonwebtoken.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
	}

}

