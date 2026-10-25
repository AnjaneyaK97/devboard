import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles, Plus, ExternalLink } from 'lucide-react';
import { api } from '../../services/api.js';

export default function ResumeUploader({ currentResumeUrl, onSkillsExtracted }) {
  const [uploading, setUploading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState(currentResumeUrl || '');
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please select a valid PDF file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Resume PDF must be smaller than 5MB.');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const res = await api.post('/uploads/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { resumeUrl: newUrl, extractedSkills, estimatedExperienceYears, preview } = res.data.data;
      setResumeUrl(newUrl);
      setExtractedData({
        extractedSkills: extractedSkills || [],
        estimatedExperienceYears,
        preview,
        fileName: file.name,
      });

      if (onSkillsExtracted && extractedSkills?.length > 0) {
        onSkillsExtracted(extractedSkills);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload and parse resume');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Resume Document & Skill Parser
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Upload your PDF resume to auto-detect skills and optimize your Smart Job Match Score
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Box */}
      <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500 rounded-2xl p-6 text-center transition cursor-pointer group">
        <input
          type="file"
          accept=".pdf,application/pdf"
          disabled={uploading}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="space-y-2 pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            {uploading ? (
              <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {uploading ? 'Analyzing and parsing resume...' : 'Click to upload or drag and drop your PDF'}
            </p>
            <p className="text-[11px] text-slate-400">PDF up to 5MB</p>
          </div>
        </div>
      </div>

      {/* Active Resume Display */}
      {resumeUrl && (
        <div className="p-3 bg-teal-50/60 dark:bg-teal-950/40 rounded-xl border border-teal-200/80 dark:border-teal-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>Active Resume Attached</span>
          </div>
          <a
            href={resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="text-teal-600 dark:text-teal-400 hover:underline font-bold flex items-center gap-1"
          >
            <span>View PDF</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Extracted Skills & Experience */}
      {extractedData && extractedData.extractedSkills.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Auto-Detected Skills ({extractedData.extractedSkills.length})
            </span>
            {extractedData.estimatedExperienceYears > 0 && (
              <span className="text-[11px] font-semibold text-slate-500">
                ~{extractedData.estimatedExperienceYears} years exp detected
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {extractedData.extractedSkills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
