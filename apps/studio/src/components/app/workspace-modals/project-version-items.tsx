import { ArrowUturnLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { DeploymentInterface, DeploymentStatus, DeploymentType } from '@/interfaces/deployment-interfaces';
import { cn } from '@/utils/cn';

// Badge Labels
const LABEL_PRODUCTION = 'Production';
const LABEL_PREVIEW = 'Preview';
const LABEL_ACTIVE = 'Active';
const LABEL_ROLLBACK = 'Rollback';
const LABEL_ROLLED_BACK_TO = 'Rolled back to';
const LABEL_VERSION_PREFIX = 'Version ';
const LABEL_DATE_NOT_AVAILABLE = 'N/A';

// Date Configuration
const DATE_LOCALE = 'en-US';
const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

// ID Display Configuration
const DEPLOYMENT_ID_DISPLAY_LENGTH = 8;

interface StatusBadgeProps {
  status: DeploymentStatus;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  if (!status) {
    return (
      <span className='rounded bg-gray-100 px-2 py-1 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-100'>
        Unknown
      </span>
    );
  }
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  return (
    <span
      className={cn(
        'rounded px-2 py-1 text-xs',
        status === DeploymentStatus.READY && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
        status === DeploymentStatus.BUILDING && 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
        status === DeploymentStatus.QUEUED && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
        status === DeploymentStatus.INITIALIZING &&
          'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
        status === DeploymentStatus.ERROR && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
        status === DeploymentStatus.CANCELED && 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
      )}
    >
      {statusLabel}
    </span>
  );
};

interface TypeBadgeProps {
  type: DeploymentType;
}

const TypeBadge = ({ type }: TypeBadgeProps) => {
  const isProduction = type === DeploymentType.PRODUCTION;

  if (isProduction) {
    return (
      <span className='rounded bg-neutral-900 px-2 py-1 text-xs text-white dark:bg-white dark:text-neutral-900'>
        {LABEL_PRODUCTION}
      </span>
    );
  }

  return (
    <span className='rounded bg-neutral-200 px-2 py-1 text-xs text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200'>
      {LABEL_PREVIEW}
    </span>
  );
};

interface RollbackInfoProps {
  deployment: DeploymentInterface;
  deployments: DeploymentInterface[];
}

const RollbackInfo = ({ deployment, deployments }: RollbackInfoProps) => {
  if (!deployment.rolledBackTo) return null;

  const targetDeployment = deployments.find((d) => d._id === deployment.rolledBackTo);
  const targetLabel = targetDeployment
    ? targetDeployment.message || `${LABEL_VERSION_PREFIX}${targetDeployment._id.slice(-DEPLOYMENT_ID_DISPLAY_LENGTH)}`
    : `${LABEL_VERSION_PREFIX}${deployment.rolledBackTo.slice(-DEPLOYMENT_ID_DISPLAY_LENGTH)}`;

  return (
    <div className='mt-1 flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400'>
      <ArrowUturnLeftIcon className='h-3.5 w-3.5' />
      <span>
        {LABEL_ROLLED_BACK_TO}: {targetLabel}
      </span>
    </div>
  );
};

interface DeploymentItemProps {
  deployment: DeploymentInterface;
  deployments: DeploymentInterface[];
  onClick: () => void;
  isFirst: boolean;
}

const DeploymentItem = ({ deployment, deployments, onClick, isFirst }: DeploymentItemProps) => {
  const isRollbackDeployment = !!deployment.rolledBackTo;
  const isReadyStatus = deployment.status === DeploymentStatus.READY;
  const isProduction = deployment.type === DeploymentType.PRODUCTION;
  const canRollback = !isRollbackDeployment && isReadyStatus;
  const isClickable = !isProduction && (canRollback || isReadyStatus);
  const showBorderTop = !isFirst;

  const displayName =
    deployment.message || `${LABEL_VERSION_PREFIX}${deployment._id.slice(-DEPLOYMENT_ID_DISPLAY_LENGTH)}`;

  const formattedDate = deployment.createdAt
    ? new Date(deployment.createdAt).toLocaleString(DATE_LOCALE, DATE_FORMAT_OPTIONS)
    : LABEL_DATE_NOT_AVAILABLE;

  const handleClick = () => {
    if (isClickable) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-center justify-between px-3 py-2 transition-colors',
        isClickable ? 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700' : 'cursor-not-allowed opacity-60',
        showBorderTop && 'border-t border-neutral-200 dark:border-white/20',
        isRollbackDeployment && 'bg-orange-50 dark:bg-orange-950/20'
      )}
    >
      <div className='flex min-w-0 flex-1 items-center gap-3'>
        <div className='flex min-w-0 flex-1 flex-col'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='truncate text-sm font-medium text-neutral-900 dark:text-white'>{displayName}</span>
            <TypeBadge type={deployment.type} />
            <StatusBadge status={deployment.status} />
            {deployment.isActive && (
              <span className='rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-100'>
                {LABEL_ACTIVE}
              </span>
            )}
            {isRollbackDeployment && (
              <span className='rounded bg-orange-100 px-2 py-1 text-xs text-orange-800 dark:bg-orange-900 dark:text-orange-100'>
                {LABEL_ROLLBACK}
              </span>
            )}
          </div>
          <span className='text-xs text-neutral-500 dark:text-neutral-300'>{formattedDate}</span>
          <RollbackInfo deployment={deployment} deployments={deployments} />
        </div>
      </div>
      {isClickable && <ChevronRightIcon className='h-5 w-5 flex-shrink-0 text-neutral-400 dark:text-neutral-500' />}
    </div>
  );
};

export default DeploymentItem;
