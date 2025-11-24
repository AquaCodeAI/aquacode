import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ItemResponseDto } from '@aquacode/common/dtos';
import { Model } from 'mongoose';
import { AccountErrors } from './errors';
import { Account, AccountDocument } from './schemas';

@Injectable()
export class AccountsService {
	constructor(
		@InjectModel(Account.name)
		private readonly accountModel: Model<AccountDocument>,
	) {}

	async deleteAccountByUserId(userId: string): Promise<ItemResponseDto<number>> {
		const { deletedCount } = await this.accountModel.deleteOne({ userId });
		if (deletedCount === 0)
			throw new NotFoundException({ errors: AccountErrors.ACCOUNT_NOT_FOUND });
		return {
			result: deletedCount,
			success: true,
			messages: [],
			errors: [],
		};
	}
}
