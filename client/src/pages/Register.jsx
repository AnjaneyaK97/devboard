import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Building2, Lock, Mail, User, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { registerUser, clearAuthError } from '../redux/slices/authSlice.js';
import { showToast } from '../redux/slices/uiSlice.js';

const registerValidationSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: z.string().trim().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['seeker', 'employer']),
    companyName: z.string().trim().optional(),
    skills: z.string().trim().optional(),
    experienceYears: z.number().min(0).optional(),
  })
  .refine(
    (data) => {
      if (data.role === 'employer' && (!data.companyName || data.companyName.trim().length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'Company name is required for employers',
      path: ['companyName'],
    }
  );

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerValidationSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'seeker',
      companyName: '',
      skills: '',
      experienceYears: 0,
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'employer') {
        navigate('/dashboard/employer', { replace: true });
      } else {
        navigate('/jobs', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (formData) => {
    const payload = {
      ...formData,
      ...(formData.skills
        ? { skills: formData.skills.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) }
        : { skills: [] }),
    };

    const result = await dispatch(registerUser(payload));
    if (registerUser.fulfilled.match(result)) {
      dispatch(showToast({ message: 'Account created successfully! Welcome to DevBoard.', type: 'success' }));
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700/80 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-teal-50 dark:bg-teal-950/50 rounded-2xl text-teal-600 dark:text-teal-400 mb-1 border border-teal-100 dark:border-teal-900">
            <Briefcase className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create your account
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Join thousands of developers and companies hiring on DevBoard
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Toggle Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
          <button
            type="button"
            onClick={() => setValue('role', 'seeker')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition ${
              selectedRole === 'seeker'
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Job Seeker
          </button>
          <button
            type="button"
            onClick={() => setValue('role', 'employer')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition ${
              selectedRole === 'employer'
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Employer
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                {...register('name')}
                placeholder="Jane Doe"
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
            </div>
            {errors.name && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Work Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                {...register('email')}
                placeholder="jane@company.com"
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password (min. 8 characters)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
            </div>
            {errors.password && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Conditional employer field */}
          {selectedRole === 'employer' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  {...register('companyName')}
                  placeholder="Acme Technologies Inc."
                  className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>
              {errors.companyName && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                  {errors.companyName.message}
                </p>
              )}
            </div>
          )}

          {/* Conditional seeker field */}
          {selectedRole === 'seeker' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Skills (comma-separated)
              </label>
              <input
                type="text"
                {...register('skills')}
                placeholder="React, Node.js, TypeScript, Docker"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Used to compute your Smart Job Match Score on postings
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md shadow-teal-500/20 transition flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-teal-600 dark:text-teal-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
