'use client';

import { useState } from 'react';
import DeleteButton from './DeleteButton';
import EditShotPanel from './EditShotPanel';
import type { Shot } from '@/lib/types';

export default function ShotActions({ shot }: { shot: Shot }) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      {isEditing && (
        <EditShotPanel shot={shot} onClose={() => setIsEditing(false)} />
      )}
      <div className="pt-4 border-t border-[#C8B49A] space-y-2.5">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="w-full py-3.5 min-h-[44px] rounded-2xl font-medium text-sm text-[#2C1E16] bg-[#F3EFEA] transition-all active:scale-[0.98]"
        >
          Edit Shot
        </button>
        <DeleteButton id={shot.id} />
      </div>
    </>
  );
}
