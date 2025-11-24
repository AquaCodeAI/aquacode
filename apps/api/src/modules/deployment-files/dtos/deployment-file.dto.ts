import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class DeploymentFileDto {
	/**
	 * Unique deployment file identifier
	 * @example 'depf_01KA21TE9W906DPACGTZ494TD2'
	 */
	@ApiProperty({
		type: String,
		description: 'Unique deployment file identifier in ULID format.',
		required: true,
		example: 'depf_01KA21TE9W906DPACGTZ494TD2',
		pattern: '^depf_[0-9A-Za-z]{26}$',
		minLength: 31,
		maxLength: 31,
	})
	@Expose()
	@IsString({ message: 'ID must be a string' })
	@IsNotEmpty({ message: 'ID is required' })
	@MinLength(31, { message: 'Deployment file ID must be exactly 31 characters long' })
	@MaxLength(31, { message: 'Deployment file ID must be exactly 31 characters long' })
	@Matches(/^depf_[0-9A-Za-z]{26}$/, {
		message:
			'Deployment file ID must be in ULID format: "depf_" followed by 26 alphanumeric characters',
	})
	_id: string;

	/**
	 * Source code file name
	 * @example 'src/app/(app)/page.tsx'
	 */
	@ApiProperty({
		type: String,
		description: 'Source code file name.',
		required: true,
		example: 'src/app/(app)/page.tsx',
		minLength: 1,
		maxLength: 255,
	})
	@Expose()
	@IsString({ message: 'Name must be a string' })
	@IsNotEmpty({ message: 'Name is required' })
	@MinLength(1, { message: 'Name must be at least 1 character' })
	@MaxLength(255, { message: 'Name must not exceed 255 characters' })
	name: string;

	/**
	 * Source code file content
	 * @example 'export default function App() { return <div>Welcome to Recipe Finder!</div>; }'
	 */
	@ApiProperty({
		type: String,
		description: 'Source code file content.',
		required: true,
		example: 'export default function App() { return <div>Welcome to Recipe Finder!</div>; }',
	})
	@Expose()
	@IsString({ message: 'Content must be a string' })
	@IsNotEmpty({ message: 'Content is required' })
	content: string;

	/**
	 * Associated project identifier
	 * @example 'prj_01K9FRAGHJ0J7VJPCPYVVC1EYS'
	 */
	@ApiProperty({
		type: String,
		description: 'Project identifier in ULID format with prj_ prefix.',
		required: true,
		example: 'prj_01K9FRAGHJ0J7VJPCPYVVC1EYS',
		pattern: '^prj_[0-9A-Za-z]{26}$',
		minLength: 30,
		maxLength: 30,
	})
	@Expose()
	@IsString({ message: 'Project ID must be a string' })
	@IsNotEmpty({ message: 'Project ID is required' })
	@MinLength(30, { message: 'Project ID must be exactly 30 characters long' })
	@MaxLength(30, { message: 'Project ID must be exactly 30 characters long' })
	@Matches(/^prj_[0-9A-Za-z]{26}$/, {
		message: 'Project ID must be in ULID format: "prj_" followed by 26 alphanumeric characters',
	})
	projectId: string;

	/**
	 * Associated deployment identifier
	 * @example 'dpl_01JV5V3CVXQNYFM2NHCRBM7KQH'
	 */
	@ApiProperty({
		type: String,
		description: 'Unique deployment identifier in ULID format.',
		required: true,
		example: 'dpl_01JV5V3CVXQNYFM2NHCRBM7KQH',
		pattern: '^dpl_[0-9A-Za-z]{26}$',
		minLength: 30,
		maxLength: 30,
	})
	@Expose()
	@IsString({ message: 'Deployment ID must be a string' })
	@IsNotEmpty({ message: 'Deployment ID is required' })
	@MinLength(30, { message: 'Deployment ID must be exactly 30 characters long' })
	@MaxLength(30, { message: 'Deployment ID must be exactly 30 characters long' })
	@Matches(/^dpl_[0-9A-Za-z]{26}$/, {
		message:
			'Deployment ID must be in ULID format: "dpl_" followed by 26 alphanumeric characters',
	})
	deploymentId: string;

	/**
	 * File creation timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Source code file creation timestamp.',
		required: true,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsDate({ message: 'Created at must be a valid date' })
	@IsNotEmpty({ message: 'Created at is required' })
	createdAt?: Date;

	/**
	 * File last update timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Source code file last update timestamp.',
		required: true,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsDate({ message: 'Updated at must be a valid date' })
	@IsNotEmpty({ message: 'Updated at is required' })
	updatedAt?: Date;
}
