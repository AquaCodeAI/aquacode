import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class DocumentIdDto {
	/**
	 * Unique document identifier
	 * @example 'doc_01KA9FMVEDP5P6GB5JQNW6E4WR'
	 */
	@ApiProperty({
		type: String,
		description: 'Unique document identifier in ULID format.',
		required: true,
		example: 'doc_01KA9FMVEDP5P6GB5JQNW6E4WR',
		minLength: 30,
		maxLength: 30,
	})
	@Expose()
	@IsString({ message: 'documentId must be a string' })
	@IsNotEmpty({ message: 'documentId is required' })
	documentId: string;
}
