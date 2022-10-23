import {
	Controller,
	Get,
	Req,
	UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {

	@Get('discord')
	@UseGuards(AuthGuard('discord'))
	async discordLogin(@Req() req): Promise<any> {
		return req.user;
	}

	@Get('google')
	@UseGuards(AuthGuard('google'))
	async googleLogin(@Req() req): Promise<any> {
		return req.user;
	}

	@Get('steam')
	@UseGuards(AuthGuard('steam'))
	async steamLogin(@Req() req): Promise<any> {
		return req.user;
	}
	
		
	@Get('user')
	@UseGuards(AuthGuard('jwt'))
	async fetchUser(@Req() req): Promise<any> {
		return req.user;
	}

}

