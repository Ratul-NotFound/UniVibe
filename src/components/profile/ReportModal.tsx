import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useSafety } from '@/hooks/useSafety';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUid: string;
  userName: string;
}

const REPORT_REASONS = [
  'Harassment',
  'Fake Account',
  'Inappropriate Content',
  'Spam',
  'Offline Behavior',
  'Other'
];

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, targetUid, userName }) => {
  const { reportUser } = useSafety();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setLoading(true);
    await reportUser(targetUid, reason, description);
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Report ${userName}`}>
      <div className="space-y-4">
        <p className="text-sm text-zinc-500">
          Your report is anonymous. We will review it and take action within 24 hours.
        </p>
        
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Reason</label>
          <div className="grid grid-cols-2 gap-2">
            {REPORT_REASONS.map(r => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`rounded-card border p-2 text-center text-xs font-semibold transition-colors ${reason === r ? 'border-primary bg-primary/5 text-primary' : 'border-zinc-100 dark:border-zinc-800'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Details (Optional)</label>
          <textarea
            className="w-full rounded-card border border-zinc-100 bg-zinc-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-800 dark:bg-zinc-800"
            placeholder="Tell us more about what happened..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="pt-2">
          <Button 
            className="w-full font-bold" 
            variant="danger" 
            onClick={handleSubmit}
            isLoading={loading}
            disabled={!reason}
          >
            Submit Report
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReportModal;
