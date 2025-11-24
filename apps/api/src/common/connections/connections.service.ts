import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ItemResponseDto } from '@aquacode/common/dtos';
import { NotFoundException } from '@aquacode/common/exceptions';
import { generateULID } from '@aquacode/common/utils';
import { Model } from 'mongoose';
import { ConnectionErrors } from './errors';
import { Connection, ConnectionDocument, ConnectionSchemaItem } from './schemas';

@Injectable()
export class ConnectionsService {
	private readonly connectionPrefix: string = 'con';

	constructor(
		@InjectModel(Connection.name)
		private readonly connectionModel: Model<ConnectionDocument>,
	) {}

	async upsertConnectionByName(
		name: string,
		doc?: Pick<Connection, 'schemas'>,
	): Promise<ItemResponseDto<ConnectionDocument>> {
		const connection = await this.connectionModel.findOneAndUpdate(
			{ name },
			{
				$setOnInsert: { _id: generateULID(this.connectionPrefix), name, ...doc },
				$set: { ...doc },
			},
			{ upsert: true, new: true },
		);
		return {
			result: connection,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async upsertSchemaConnectionByName(
		name: string,
		schema: ConnectionSchemaItem,
	): Promise<ItemResponseDto<ConnectionDocument>> {
		const connectionWithUpdatedSchema = await this.connectionModel.findOneAndUpdate(
			{ name, 'schemas.name': schema.name },
			{ $set: { 'schemas.$': schema, updatedAt: new Date() } },
			{ new: true },
		);

		const schemaWasUpdated = connectionWithUpdatedSchema?.schemas?.some(
			(s) => s.name === schema.name,
		);

		if (connectionWithUpdatedSchema && schemaWasUpdated) {
			return {
				result: connectionWithUpdatedSchema,
				success: true,
				messages: [],
				errors: [],
			};
		}

		const connection = await this.connectionModel.findOneAndUpdate(
			{ name },
			{
				$setOnInsert: { _id: generateULID(this.connectionPrefix), name },
				$set: { updatedAt: new Date() },
				$push: { schemas: schema },
			},
			{ new: true, upsert: true },
		);
		return {
			result: connection,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async getConnectionByName(name: string): Promise<ItemResponseDto<ConnectionDocument>> {
		const connection: ConnectionDocument | null = await this.connectionModel.findOne({ name });
		if (!connection)
			throw new NotFoundException({ errors: ConnectionErrors.CONNECTION_NOT_FOUND });
		return {
			result: connection,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async rollbackConnectionByName(
		name: string,
		connection: Pick<Connection, 'schemas'>,
	): Promise<ItemResponseDto<ConnectionDocument>> {
		await this.connectionModel.deleteOne({ name });

		const newConnection = await this.connectionModel.create({
			_id: generateULID(this.connectionPrefix),
			name,
			...connection,
		});
		return {
			result: newConnection,
			success: true,
			messages: [],
			errors: [],
		};
	}
}
