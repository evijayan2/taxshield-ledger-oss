import React from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { Employee } from '../../types';
import { ALL_US_STATES, SUPPORTED_STATES } from '../../utils/supportedStates';

interface StaffPersonalTabProps {
  formData: Omit<Employee, 'id'>;
  errors: Record<string, string | null>;
  touched: Record<string, boolean>;
  isEditing: boolean;
  sendInvite: boolean;
  onSendInviteChange: (send: boolean) => void;
  onChange: (field: keyof Omit<Employee, 'id'>, value: any) => void;
  onBlur: (field: keyof Omit<Employee, 'id'>) => void;
  onResidenceStateChange: (newState: string) => void;
}

/**
 * Tab component for Staff Personal, Contact, Relationship, and Home Address details with inline focus-out validation.
 */
export function StaffPersonalTab({
  formData,
  errors,
  touched,
  isEditing,
  sendInvite,
  onSendInviteChange,
  onChange,
  onBlur,
  onResidenceStateChange,
}: StaffPersonalTabProps) {
  const handleStateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    onChange('state', newState);
    onResidenceStateChange(newState);
  };

  const getInputClass = (field: keyof Omit<Employee, 'id'>, extraClasses: string = '') => {
    const hasError = Boolean(touched[field] && errors[field]);
    const borderClass = hasError
      ? 'border-rose-500 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20';
    return `w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 ${borderClass} ${extraClasses}`;
  };

  const renderInlineError = (field: keyof Omit<Employee, 'id'>) => {
    if (!touched[field] || !errors[field]) return null;
    return (
      <span className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium animate-in fade-in duration-200">
        <AlertCircle className="w-3 h-3 shrink-0" />
        {errors[field]}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">First Name *</label>
          <input
            type="text"
            required
            value={formData.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            onBlur={() => onBlur('firstName')}
            className={getInputClass('firstName')}
            placeholder="Jane"
          />
          {renderInlineError('firstName')}
        </div>
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Last Name *</label>
          <input
            type="text"
            required
            value={formData.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            onBlur={() => onBlur('lastName')}
            className={getInputClass('lastName')}
            placeholder="Doe"
          />
          {renderInlineError('lastName')}
        </div>
      </div>

      {/* Email & Phone */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Email Address *</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => onChange('email', e.target.value)}
            onBlur={() => onBlur('email')}
            className={getInputClass('email')}
            placeholder="jane@example.com"
          />
          {renderInlineError('email')}
        </div>
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Phone Number</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            onBlur={() => onBlur('phone')}
            className={getInputClass('phone')}
            placeholder="(555) 000-0000"
          />
          {renderInlineError('phone')}
        </div>
      </div>

      {/* Email Invitation Option for new staff */}
      {!isEditing && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
          <input
            type="checkbox"
            id="sendInviteCheckbox"
            checked={sendInvite}
            onChange={(e) => onSendInviteChange(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-700 focus:ring-emerald-500 cursor-pointer"
          />
          <label htmlFor="sendInviteCheckbox" className="text-xs text-emerald-950 dark:text-emerald-200 cursor-pointer select-none space-y-0.5">
            <span className="font-semibold block">Send Employee Portal Email Invitation</span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300/80 block">
              Dispatches a setup link to <strong className="font-mono">{formData.email.trim() || 'the specified email'}</strong> so the employee can set their password.
            </span>
          </label>
        </div>
      )}

      {/* Age, SSN & Status */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Age</label>
          <input
            type="number"
            min="16"
            max="100"
            value={formData.age ?? ''}
            onChange={(e) => onChange('age', parseInt(e.target.value, 10) || undefined)}
            onBlur={() => onBlur('age')}
            className={getInputClass('age', 'font-mono')}
            placeholder="30"
          />
          {renderInlineError('age')}
        </div>
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">SSN Last 4</label>
          <input
            type="text"
            maxLength={4}
            value={formData.ssnLastFour}
            onChange={(e) => onChange('ssnLastFour', e.target.value)}
            onBlur={() => onBlur('ssnLastFour')}
            className={getInputClass('ssnLastFour', 'font-mono')}
            placeholder="1234"
          />
          {renderInlineError('ssnLastFour')}
        </div>
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Status</label>
          <select
            value={formData.isActive ? 'active' : 'inactive'}
            onChange={(e) => onChange('isActive', e.target.value === 'active')}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-medium"
          >
            <option value="active">Active Staff</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Relationship to Owner */}
      <div>
        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Relationship to Owner</label>
        <select
          value={formData.relationshipToOwner || 'NONE'}
          onChange={(e) => onChange('relationshipToOwner', e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
        >
          <option value="NONE">Standard W-2 Employee (Unrelated)</option>
          <option value="CHILD_UNDER_18">Child (Under 18) — FICA & SUTA Exempt</option>
          <option value="CHILD_18_TO_20">Child (18–20) — SUTA Exempt</option>
          <option value="SPOUSE">Spouse — SUTA Exempt</option>
          <option value="PARENT">Parent — SUTA Exempt</option>
        </select>
      </div>

      {/* Home Address Section */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400" /> Home Street Address (Residence)
        </label>
        <input
          type="text"
          value={formData.streetAddress || ''}
          onChange={(e) => onChange('streetAddress', e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white mb-2"
          placeholder="742 Evergreen Terrace"
        />
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-5">
            <input
              type="text"
              value={formData.city || ''}
              onChange={(e) => onChange('city', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
              placeholder="City"
            />
          </div>
          <div className="col-span-4">
            <select
              value={formData.state || 'DE'}
              onChange={handleStateSelect}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-medium"
            >
              <optgroup label="Supported Tax Engine States">
                {SUPPORTED_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Other US States">
                {ALL_US_STATES.filter((s) => !SUPPORTED_STATES.some((sup) => sup.code === s.code)).map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          <div className="col-span-3">
            <input
              type="text"
              value={formData.zip || ''}
              onChange={(e) => onChange('zip', e.target.value)}
              onBlur={() => onBlur('zip')}
              className={getInputClass('zip', 'font-mono')}
              placeholder="ZIP"
            />
            {renderInlineError('zip')}
          </div>
        </div>
      </div>
    </div>
  );
}
