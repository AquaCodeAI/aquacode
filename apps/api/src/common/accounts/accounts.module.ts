import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountsService } from './accounts.service';
import { Account, AccountSchema } from './schemas';

@Global()
@Module({
	imports: [MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }])],
	providers: [AccountsService],
	exports: [AccountsService],
})
export class AccountsModule {}
