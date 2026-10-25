import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { User, MapPin, Briefcase, Building2, Globe, Check, Plus, X } from 'lucide-react';
import { updateUserProfile } from '../redux/slices/authSlice.js';
import { showToast } from '../redux/slices/uiSlice.js';
import ResumeUploader from '../components/profile/ResumeUploader.jsx';

export default function Profile() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [skillsList, setSkillsList] = useState(user?.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
      location: user?.location || '',
      experienceYears: user?.experienceYears || 0,
      companyName: user?.companyName || '',
      companyWebsite: user?.companyWebsite || '',
      companyLogo: user?.companyLogo || '',
    },
  });

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !skillsList.includes(newSkill.trim().toLowerCase())) {
      setSkillsList([...skillsList, newSkill.trim().toLowerCase()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsList(skillsList.filter((s) => s !== skillToRemove));
  };

  const onSubmit = async (data) => {
    setIsSaving(true);
    const payload = {
      ...data,
      experienceYears: Number(data.experienceYears),
      skills: skillsList,
    };

    const result = await dispatch(updateUserProfile(payload));
    setIsSaving(false);
    if (updateUserProfile.fulfilled.match(result)) {
      dispatch(showToast({ message: 'Profile updated successfully!', type: 'success' }));
    } else {
      dispatch(showToast({ message: 'Failed to update profile', type: 'error' }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-3xl shadow-lg shadow-teal-500/20">
          {user?.name ? user.name[0].toUpperCase() : 'U'}
        </div>
        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{user?.name}</h1>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 w-fit mx-auto sm:mx-0">
              {user?.role}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
        </div>
      </div>

      {/* Resume Document Upload & Skill Parsing (Seeker only) */}
      {user?.role === 'seeker' && (
        <ResumeUploader
          currentResumeUrl={user?.resumeUrl}
          onSkillsExtracted={(newExtracted) => {
            const merged = Array.from(new Set([...skillsList, ...newExtracted]));
            setSkillsList(merged);
            dispatch(showToast({ message: `Added ${newExtracted.length} detected skills to your profile!`, type: 'success' }));
          }}
        />
      )}

      {/* Profile Edit Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3">
            General Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                {...register('name')}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  {...register('location')}
                  placeholder="e.g. San Francisco, CA or Remote"
                  className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Professional Bio
            </label>
            <textarea
              rows={3}
              {...register('bio')}
              placeholder="Tell employers or candidates about your background, expertise, and focus areas..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
            />
          </div>

          {/* Seeker Specific: Experience & Skills */}
          {user?.role === 'seeker' && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Years of Professional Experience
                </label>
                <input
                  type="number"
                  min="0"
                  {...register('experienceYears')}
                  className="w-32 px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Skills & Technologies (Used for Smart Job Match percentage)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="e.g. React, GraphQL, Docker..."
                    className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddSkill(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {skillsList.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-rose-600 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {skillsList.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No skills listed yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Employer Specific: Company details */}
          {user?.role === 'employer' && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Company Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Company Name
                  </label>
                  <input
                    type="text"
                    {...register('companyName')}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Website URL
                  </label>
                  <input
                    type="text"
                    {...register('companyWebsite')}
                    placeholder="https://acme.com"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md shadow-teal-500/20 transition flex items-center gap-2"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" /> Save Profile
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
