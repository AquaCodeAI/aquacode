import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AccountsService } from '@aquacode/common/accounts';
import { AuthService, UserSession } from '@aquacode/common/auth';
import { ItemResponseDto, ListResponseDto } from '@aquacode/common/dtos';
import { BadRequestException, NotFoundException } from '@aquacode/common/exceptions';
import { SessionsService } from '@aquacode/common/sessions';
import { generateAvatarImage } from '@aquacode/common/utils';
import { Model } from 'mongoose';
import { CreateUserDto, UserFilteringParameterDto } from './dtos';
import { UserErrors } from './errors';
import { User, UserDocument } from './schemas';

@Injectable()
export class UsersService {
	constructor(
		@InjectModel(User.name)
		private readonly userModel: Model<UserDocument>,
		private readonly accountService: AccountsService,
		private readonly sessionService: SessionsService,
		private readonly authService: AuthService,
	) {}

	async getUsers(filter: UserFilteringParameterDto): Promise<ListResponseDto<UserDocument>> {
		const { page, perPage, connection } = filter;

		let query = this.userModel.find({ connection });
		if (page && perPage) {
			const skip = (page - 1) * perPage;
			query = query.skip(skip).limit(perPage);
		}

		const result: UserDocument[] = await query;
		const totalCount = await this.userModel.countDocuments({ connection });

		return {
			result,
			resultInfo: {
				page: page || 1,
				perPage: perPage || totalCount,
				totalCount,
			},
			success: true,
			messages: [],
			errors: [],
		};
	}

	async createUser(userData: CreateUserDto): Promise<ItemResponseDto<UserSession['user']>> {
		const { email, password, connection } = userData;
		const { result: emailExists } = await this.existUserByEmailAndConnection(email, connection);
		if (emailExists) {
			throw new BadRequestException({
				errors: UserErrors.USER_EMAIL_ALREADY_EXISTS,
			});
		}

		const name = email.split('@')[0];
		const avatar = generateAvatarImage(name);
		const { user } = await this.authService.getAuthApi().createUser({
			body: {
				name,
				email,
				password,
				// Better auth requires data for pass the additional fields like connection
				data: { connection, avatar },
			},
		});

		return {
			result: user,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async existUserByEmailAndConnection(
		email: string,
		connection: string,
	): Promise<ItemResponseDto<boolean>> {
		const user = await this.userModel.exists({ email, connection });
		return {
			result: Boolean(user),
			success: true,
			messages: [],
			errors: [],
		};
	}

	async getUserById(userId: string): Promise<ItemResponseDto<UserDocument>> {
		const user = await this.userModel.findOne({ _id: userId });
		if (!user) throw new NotFoundException({ errors: UserErrors.USER_NOT_FOUND });
		return {
			result: user,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async deleteUser(userId: string): Promise<void> {
		await this.userModel.deleteOne({ _id: userId });
		await this.sessionService.revokeSessionsByUserId(userId);
		await this.accountService.deleteAccountByUserId(userId);
	}
}
