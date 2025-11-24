import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
	IsBoolean,
	IsDate,
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
	MinLength,
	ValidateNested,
} from 'class-validator';
import { DeploymentStatus, DeploymentType } from '../enums';
import { DeploymentMetaDataDto } from './deployment-meta-data.dto';

export class DeploymentDto {
	/**
	 * Unique deployment identifier
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
	_id: string;

	/**
	 * Deployment type
	 * @example 'PREVIEW'
	 */
	@ApiProperty({
		enum: DeploymentType,
		description: 'Type of deployment: PREVIEW or PRODUCTION.',
		required: true,
		example: DeploymentType.PREVIEW,
	})
	@Expose()
	@IsEnum(DeploymentType, { message: 'Type must be either PREVIEW or PRODUCTION' })
	@IsNotEmpty({ message: 'Type is required' })
	type: DeploymentType;

	/**
	 * Deployment domain
	 * @example 'ai-recipe-finder-preview.vercel.app'
	 */
	@ApiProperty({
		type: String,
		description: 'Domain where the deployment is accessible.',
		required: false,
		example: 'ai-recipe-finder-preview.vercel.app',
	})
	@Expose()
	@IsOptional()
	@IsString({ message: 'Domain must be a string' })
	domain?: string;

	/**
	 * Deployment status
	 * @example 'READY'
	 */
	@ApiProperty({
		enum: DeploymentStatus,
		description: 'Status of the deployment.',
		required: false,
		example: DeploymentStatus.READY,
	})
	@Expose()
	@IsOptional()
	@IsEnum(DeploymentStatus, {
		message: 'Status must be one of: QUEUED, BUILDING, ERROR, INITIALIZING, READY, or CANCELED',
	})
	status?: DeploymentStatus;

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
	 * Associated sandbox identifier
	 * @example 'sbx_01K9FRAPZF9GX63D7T1WHKBGNS'
	 */
	@ApiProperty({
		type: String,
		description: 'Sandbox identifier in ULID format with sbx_ prefix.',
		required: false,
		example: 'sbx_01K9FRAPZF9GX63D7T1WHKBGNS',
		pattern: '^sbx_[0-9A-Za-z]{26}$',
		minLength: 30,
		maxLength: 30,
	})
	@Expose()
	@IsOptional()
	@IsString({ message: 'Sandbox ID must be a string' })
	@MinLength(30, { message: 'Sandbox ID must be exactly 30 characters long' })
	@MaxLength(30, { message: 'Sandbox ID must be exactly 30 characters long' })
	@Matches(/^sbx_[0-9A-Za-z]{26}$/, {
		message: 'Sandbox ID must be in ULID format: "sbx_" followed by 26 alphanumeric characters',
	})
	sandboxId?: string;

	/**
	 * Source preview deployment ID for promotion
	 * @example 'dpl_01JV5V3CVXQNYFM2NHCRBM7KQH'
	 */
	@ApiProperty({
		type: String,
		description: 'ID of the preview deployment that was promoted to production.',
		required: false,
		example: 'dpl_01JV5V3CVXQNYFM2NHCRBM7KQH',
	})
	@Expose()
	@IsOptional()
	@IsString({ message: 'Promoted from must be a string' })
	promotedFrom?: string;

	/**
	 * Promotion timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Timestamp when the preview deployment was promoted to production.',
		required: false,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsOptional()
	@IsDate({ message: 'Promoted at must be a valid date' })
	promotedAt?: Date;

	/**
	 * Source deployment ID for rollback
	 * @example 'dpl_01JV5V3CVXQNYFM2NHCRBM7KQH'
	 */
	@ApiProperty({
		type: String,
		description: 'ID of the production deployment that was rolled back from.',
		required: false,
		example: 'dpl_01JV5V3CVXQNYFM2NHCRBM7KQH',
	})
	@Expose()
	@IsOptional()
	@IsString({ message: 'Rolled back from must be a string' })
	rolledBackFrom?: string;

	/**
	 * Target deployment ID for rollback
	 * @example 'dpl_01JV5V3CVXQNYFM2NHCRBM7KQH'
	 */
	@ApiProperty({
		type: String,
		description: 'ID of the production deployment that was rolled back to.',
		required: false,
		example: 'dpl_01JV5V3CVXQNYFM2NHCRBM7KQH',
	})
	@Expose()
	@IsOptional()
	@IsString({ message: 'Rolled back to must be a string' })
	rolledBackTo?: string;

	/**
	 * Rollback timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Timestamp when the production deployment was rolled back.',
		required: false,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsOptional()
	@IsDate({ message: 'Rolled back at must be a valid date' })
	rolledBackAt?: Date;

	/**
	 * Rollback indicator
	 * @example false
	 */
	@ApiProperty({
		type: Boolean,
		description: 'Whether deployment is a rollback.',
		required: false,
		example: false,
	})
	@Expose()
	@IsOptional()
	@IsBoolean({ message: 'Is rollback must be a boolean value' })
	isRollback?: boolean;

	/**
	 * Active status
	 * @example true
	 */
	@ApiProperty({
		type: Boolean,
		description: 'Whether deployment is active.',
		required: false,
		example: true,
	})
	@Expose()
	@IsOptional()
	@IsBoolean({ message: 'Is active must be a boolean value' })
	isActive?: boolean;

	/**
	 * Deployment provider metadata
	 */
	@ApiProperty({
		type: () => DeploymentMetaDataDto,
		required: false,
		description: 'Deployment metadata container',
	})
	@Expose()
	@IsOptional()
	@Type(() => DeploymentMetaDataDto)
	@ValidateNested()
	deploymentMetaData?: DeploymentMetaDataDto;

	/**
	 * Deployment creation timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Deployment creation timestamp.',
		required: true,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsDate({ message: 'Created at must be a valid date' })
	@IsNotEmpty({ message: 'Created at is required' })
	createdAt?: Date;

	/**
	 * Deployment last update timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Deployment last update timestamp.',
		required: true,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsDate({ message: 'Updated at must be a valid date' })
	@IsNotEmpty({ message: 'Updated at is required' })
	updatedAt?: Date;
}
