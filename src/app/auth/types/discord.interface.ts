

export interface DiscordUser {
	id: string;
	username: string;
	discriminator: string;
	avatar: string;
	verified: boolean;
	email: string;
}