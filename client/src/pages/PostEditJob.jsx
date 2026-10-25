import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { Briefcase, Building2, Plus, X, Check, ArrowLeft } from 'lucide-react';
import { createJobPost, updateJobPost, fetchJobDetail } from '../redux/slices/jobSlice.js';
import { showToast } from '../redux/slices/uiSlice.js';

const jobFormSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters'),
    company: z.string().trim().min(2, 'Company name is required'),
    location: z.string().trim().min(2, 'Location is required'),
    jobType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'temporary']),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']),
    salaryMin: z.number().min(0).default(0),
    salaryMax: z.number().min(0).default(0),
    remote: z.boolean().default(false),
    status: z.enum(['draft', 'active']).default('active'),
    description: z.string().trim().min(20, 'Description must be at least 20 characters'),
  })
  .refine(
    (data) => {
      if (data.salaryMax > 0 && data.salaryMin > 0) {
        return data.salaryMax >= data.salaryMin;
      }
      return true;
    },
    {
      message: 'Maximum salary must be greater than or equal to minimum salary',
      path: ['salaryMax'],
    }
  );

export default function PostEditJob() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [skillsList, setSkillsList] = useState(['react', 'node.js']);
  const [skillInput, setSkillInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: '',
      company: user?.companyName || '',
      location: 'Remote',
      jobType: 'full-time',
      experienceLevel: 'mid',
      salaryMin: 100000,
      salaryMax: 140000,
      remote: true,
      status: 'active',
      description: '',
    },
  });

  useEffect(() => {
    if (isEditing) {
      dispatch(fetchJobDetail(id)).then((res) => {
        if (res.payload) {
          const j = res.payload;
          setValue('title', j.title);
          setValue('company', j.company);
          setValue('location', j.location);
          setValue('jobType', j.jobType);
          setValue('experienceLevel', j.experienceLevel);
          setValue('salaryMin', j.salaryMin);
          setValue('salaryMax', j.salaryMax);
          setValue('remote', j.remote);
          setValue('status', j.status);
          setValue('description', j.description);
          if (j.skills) setSkillsList(j.skills);
        }
      });
    }
  }, [dispatch, id, isEditing, setValue]);

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (skillInput.trim() && !skillsList.includes(skillInput.trim().toLowerCase())) {
      setSkillsList([...skillsList, skillInput.trim().toLowerCase()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setSkillsList(skillsList.filter((s) => s !== skill));
  };

  const onSubmit = async (data) => {
    if (skillsList.length === 0) {
      dispatch(showToast({ message: 'Please add at least one required skill', type: 'error' }));
      return;
    }

    setSubmitting(true);
    const payload = {
      ...data,
      salaryMin: Number(data.salaryMin),
      salaryMax: Number(data.salaryMax),
      skills: skillsList,
    };

    let result;
    if (isEditing) {
      result = await dispatch(updateJobPost({ id, data: payload }));
    } else {
      result = await dispatch(createJobPost(payload));
    }

    setSubmitting(false);

    if (createJobPost.fulfilled.match(result) || updateJobPost.fulfilled.match(result)) {
      dispatch(
        showToast({
          message: isEditing ? 'Job updated successfully!' : 'Job published successfully!',
          type: 'success',
        })
      );
      navigate('/dashboard/employer');
    } else {
      dispatch(showToast({ message: result.payload || 'Failed to save job', type: 'error' }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Return
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Job Opening' : 'Post a New Job Opening'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Publish your role to reach qualified developers with transparent compensation
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Job Title
            </label>
            <input
              type="text"
              {...register('title')}
              placeholder="e.g. Senior Full-Stack Engineer"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
            {errors.title && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                {...register('company')}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              {errors.company && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                  {errors.company.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Location
              </label>
              <input
                type="text"
                {...register('location')}
                placeholder="e.g. San Francisco, CA or Remote"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              {errors.location && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                  {errors.location.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Job Type
              </label>
              <select
                {...register('jobType')}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="temporary">Temporary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Experience Level
              </label>
              <select
                {...register('experienceLevel')}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="lead">Lead / Principal</option>
                <option value="executive">Executive</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('remote')}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Remote Allowed
                </span>
              </label>
            </div>
          </div>

          {/* Salary Min & Max */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Minimum Annual Salary ($)
              </label>
              <input
                type="number"
                step="5000"
                {...register('salaryMin', { valueAsNumber: true })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Maximum Annual Salary ($)
              </label>
              <input
                type="number"
                step="5000"
                {...register('salaryMax', { valueAsNumber: true })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              {errors.salaryMax && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                  {errors.salaryMax.message}
                </p>
              )}
            </div>
          </div>

          {/* Skills Required */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Required Skills (Hit Enter or Add)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="e.g. React, Node.js, TypeScript, PostgreSQL..."
                className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSkill(e);
                }}
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skillsList.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-rose-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Job Description & Responsibilities
            </label>
            <textarea
              rows={8}
              {...register('description')}
              placeholder="Outline what the role involves, technical challenges, and what success looks like..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
            {errors.description && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Status Selection */}
          <div className="flex items-center gap-4 pt-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Publishing Status:
            </span>
            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="radio"
                value="active"
                {...register('status')}
                className="w-3.5 h-3.5 text-teal-600"
              />
              <span>Active (Live on Board)</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="radio"
                value="draft"
                {...register('status')}
                className="w-3.5 h-3.5 text-teal-600"
              />
              <span>Draft (Unlisted)</span>
            </label>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md shadow-teal-500/20 transition flex items-center gap-2"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" /> {isEditing ? 'Update Job' : 'Publish Job'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
