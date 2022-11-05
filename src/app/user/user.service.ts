import { UserDocument } from '../user/model/User.schema';

import {
	Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './model/User.schema';

@Injectable()
export class UserService {
	constructor(@InjectModel(User.name) private readonly UserModel: Model<User>) { }

	async findByIdentifier(identifier: string, value: string): Promise<any> {
		const user = await this.UserModel.findOne({ [identifier]: value });

		if (!user) {
			return null;
		}

		return user;
	}

	async createUser(user: Partial<User>): Promise<any> {
		const newUser = await this.UserModel.create(user);

		return newUser;
	}

	canAfford(user: Partial<UserDocument>, amount: number): boolean {
		return user.balance >= amount;
	}

	async updateBalance(id: string, amount: number): Promise<any> {
		await this.UserModel.updateOne({ _id: id }, { $inc: { balance: amount } });

		return true;
	}
}

