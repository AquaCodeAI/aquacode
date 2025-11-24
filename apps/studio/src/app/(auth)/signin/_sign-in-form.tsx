'use client';

import { FormEvent, useState } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AQUA_SESSION_TOKEN } from '@/constants/aqua-constants';
import { ListResponseInterface } from '@/interfaces/response-interfaces';
import { SignInInterface } from '@/interfaces/auth-interfaces';
import { fetchClient, FetchClientError } from '@/utils/fetch-client';
import { setLocalStorageItem } from '@/utils/local-storage';

const signInSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required').min(8, 'Password must be at least 8 characters'),
});

export default function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email || errors.general) {
      setErrors((prev) => ({ ...prev, email: undefined, general: undefined }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password || errors.general) {
      setErrors((prev) => ({ ...prev, password: undefined, general: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const result = signInSchema.safeParse({ email, password });

    if (!result.success) {
      const newErrors: { email?: string; password?: string } = {};

      if (result.error && result.error.issues) {
        result.error.issues.forEach((issue) => {
          const field = issue.path[0] as 'email' | 'password';
          if (!newErrors[field]) {
            newErrors[field] = issue.message;
          }
        });
      }

      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const { data } = await fetchClient<{ token: string }>({
        url: '/v1/auth/sign-in/email',
        method: 'POST',
        data: result.data,
      });

      setErrors({});
      setLocalStorageItem(AQUA_SESSION_TOKEN, data.token);
      window.location.href = '/';
    } catch (error: unknown) {
      if (error instanceof FetchClientError && error.response?.data) {
        const responseData = error.response.data as ListResponseInterface<SignInInterface>;
        if (responseData.errors && responseData.errors.length > 0) {
          setErrors({ general: responseData.errors.join(', ') });
        } else {
          setErrors({ general: 'Error signing in. Please try again.' });
        }
      } else {
        setErrors({ general: 'Error signing in. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='xs:pr-10 xs:pl-10 space-y-5 pt-2 pb-2'>
      <div>
        <div className='mb-3'>
          <Input
            type='email'
            label='Email'
            placeholder=''
            value={email}
            onValueChange={handleEmailChange}
            isRequired
            autoComplete='email'
            autoCapitalize='none'
            size='md'
            labelPlacement='inside'
            autoFocus
            isInvalid={!!errors.email}
            classNames={{
              input: 'text-black text-md peer placeholder-transparent',
              inputWrapper: `bg-[#FEFEFE] ${errors.password || errors.general ? 'border-red-500' : 'border-[#BEC5CE]'} border-1.5 rounded-[10px] dark:border-[#BEC5CE]`,
              label: `text-gray-500 dark:text-gray-500 font-light text-lg pl-2`,
              innerWrapper: 'pl-2',
            }}
          />
        </div>

        <div className='mt-3'>
          <Input
            type={showPassword ? 'text' : 'password'}
            label='Password'
            placeholder=''
            value={password}
            onValueChange={handlePasswordChange}
            isRequired
            autoComplete='current-password'
            autoCapitalize='none'
            size='md'
            labelPlacement='inside'
            isInvalid={!!errors.password}
            classNames={{
              input: 'text-black text-md peer placeholder-transparent',
              inputWrapper: `bg-[#FEFEFE] ${errors.password || errors.general ? 'border-red-500' : 'border-[#BEC5CE]'} border-1.5 rounded-[10px] dark:border-[#BEC5CE]`,
              label: `text-gray-500 dark:text-gray-500 font-light text-lg pl-2`,
              innerWrapper: 'pl-2',
            }}
            endContent={
              <Button
                type='button'
                variant='light'
                size='sm'
                isIconOnly
                className='px-0 text-[#65676e] hover:text-black'
                onPress={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeSlashIcon className='h-6 w-6 text-gray-600' />
                ) : (
                  <EyeIcon className='h-6 w-6 text-gray-600' />
                )}
              </Button>
            }
          />
        </div>
      </div>

      {(errors.email || errors.password || errors.general) && (
        <div className='mt-2 flex items-center text-sm text-red-600'>
          <ExclamationCircleIcon className='mr-1 h-5 w-5' />
          <span>{errors.general || errors.email || errors.password || 'Incorrect email or password'}</span>
        </div>
      )}

      <Button
        type='submit'
        size='xl'
        disabled={loading}
        className='text-md h-12 w-full rounded-[10px] bg-[#11224D] font-semibold text-[#FEFEFE] disabled:opacity-50'
      >
        Log in
      </Button>
    </form>
  );
}
