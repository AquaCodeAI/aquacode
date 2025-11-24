import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PoliciesService } from './policies.service';
import { Policy, PolicySchema } from './schemas';

@Module({
	imports: [MongooseModule.forFeature([{ name: Policy.name, schema: PolicySchema }])],
	providers: [PoliciesService],
	exports: [PoliciesService],
})
export class PoliciesModule {}
