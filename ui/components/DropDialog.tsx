'use client';
import { changeFlowState } from '@/app/mirrors/[mirrorId]/handlers';
import { DeleteScript } from '@/app/scripts/handlers';
import { FlowStatus } from '@/grpc_generated/flow';
import { BarLoader } from '@/lib/BarLoader';
import { Button } from '@/lib/Button';
import { Checkbox } from '@/lib/Checkbox';
import { Dialog, DialogClose } from '@/lib/Dialog';
import { Icon } from '@/lib/Icon';
import { Label } from '@/lib/Label';
import { RowWithCheckbox } from '@/lib/Layout';
import { Dispatch, SetStateAction, useState, useTransition } from 'react';

interface dropMirrorArgs {
  flowJobName: string;
}

interface dropPeerArgs {
  peerName: string;
}

interface deleteAlertArgs {
  id: number | bigint;
}

interface deleteScriptArgs {
  scriptId: number;
}

async function handleDropMirror(
  dropArgs: dropMirrorArgs,
  setMsg: Dispatch<SetStateAction<string>>,
  dropStats: boolean,
  onDeleting?: (flowJobName: string) => void,
  onDeleteFailed?: (flowJobName: string) => void
) {
  onDeleting?.(dropArgs.flowJobName);
  const res = await changeFlowState(
    dropArgs.flowJobName,
    FlowStatus.STATUS_TERMINATING,
    dropStats
  );
  if (res.status !== 200) {
    onDeleteFailed?.(dropArgs.flowJobName);
    setMsg(`Unable to start dropping mirror ${dropArgs.flowJobName}.`);
    return false;
  }
  return true;
}

export default function DropDialog({
  mode,
  dropArgs,
  onDeleting,
  onDeleteFailed,
}: {
  mode: 'PEER' | 'MIRROR' | 'ALERT' | 'SCRIPT';
  dropArgs: dropMirrorArgs | dropPeerArgs | deleteAlertArgs | deleteScriptArgs;
  onDeleting?: (flowJobName: string) => void;
  onDeleteFailed?: (flowJobName: string) => void;
}) {
  const [loading, startTransition] = useTransition();
  const [msg, setMsg] = useState('');
  const [dropStats, setDropStats] = useState(true);
  const [open, setOpen] = useState(false);

  const handleDropPeer = (dropArgs: dropPeerArgs) => {
    if (!dropArgs.peerName) {
      setMsg('Invalid peer name');
      return;
    }

    startTransition(async () => {
      const dropRes = await fetch('api/v1/peers/drop', {
        method: 'POST',
        body: JSON.stringify(dropArgs),
      });
      if (dropRes.ok) {
        setMsg('Peer dropped successfully.');
        window.location.reload();
      } else {
        const dropResError = await dropRes.json();
        setMsg(
          `Unable to drop peer ${dropArgs.peerName}. ${
            dropResError.message ?? ''
          }`
        );
      }
    });
  };

  const handleDeleteAlert = (dropArgs: deleteAlertArgs) => {
    startTransition(async () => {
      const deleteRes = await fetch(`api/v1/alerts/config/${dropArgs.id}`, {
        method: 'DELETE',
      });
      if (!deleteRes.ok) setMsg(`Unable to delete alert configuration.`);
      else {
        setMsg(`Alert configuration deleted successfully.`);
        window.location.reload();
      }
    });
  };

  const handleDeleteScript = (dropArgs: deleteScriptArgs) => {
    startTransition(async () => {
      const success = await DeleteScript(dropArgs.scriptId);
      if (success) window.location.reload();
    });
  };

  const getDeleteText = () => {
    let objectSpecificDeleteText = '';
    switch (mode) {
      case 'MIRROR':
        objectSpecificDeleteText = `mirror ${(dropArgs as dropMirrorArgs).flowJobName}`;
        break;
      case 'PEER':
        objectSpecificDeleteText = `peer ${(dropArgs as dropPeerArgs).peerName}`;
        break;
      case 'ALERT':
        objectSpecificDeleteText = 'this alert';
        break;
      case 'SCRIPT':
        objectSpecificDeleteText = 'this script';
        break;
    }
    return `Are you sure you want to delete ${objectSpecificDeleteText}? This action cannot be reverted`;
  };

  const handleDelete = () => {
    switch (mode) {
      case 'MIRROR':
        startTransition(async () => {
          const ok = await handleDropMirror(
            dropArgs as dropMirrorArgs,
            setMsg,
            dropStats,
            onDeleting,
            onDeleteFailed
          );
          if (ok) setOpen(false);
        });
        return;
      case 'PEER':
        return handleDropPeer(dropArgs as dropPeerArgs);
      case 'ALERT':
        return handleDeleteAlert(dropArgs as deleteAlertArgs);
      case 'SCRIPT':
        return handleDeleteScript(dropArgs as deleteScriptArgs);
    }
  };

  return (
    <Dialog
      noInteract={true}
      size='large'
      {...(mode === 'MIRROR' ? { open, onOpenChange: setOpen } : {})}
      triggerButton={
        <Button variant='drop'>
          {mode === 'ALERT' ? (
            <Label as='label' colorSet='destructive' colorName='lowContrast'>
              Delete
            </Label>
          ) : (
            <Icon name='delete' />
          )}
        </Button>
      }
    >
      <div>
        <Label as='label' variant='action'>
          Delete {mode.toLowerCase()}
        </Label>
        <hr style={{ margin: 0 }} />
        <Label as='label' variant='body' style={{ marginTop: '0.3rem' }}>
          {getDeleteText()}
        </Label>
        {mode === 'MIRROR' && (
          <RowWithCheckbox
            label={<Label>Delete mirror stats</Label>}
            action={
              <Checkbox
                checked={dropStats}
                onCheckedChange={(state: boolean) => setDropStats(state)}
              />
            }
          />
        )}
        <div style={{ display: 'flex', marginTop: '1rem' }}>
          <DialogClose>
            <Button variant='normal'>Cancel</Button>
          </DialogClose>
          <Button
            onClick={() => handleDelete()}
            variant='destructiveSolid'
            style={{
              marginLeft: '1rem',
            }}
          >
            {loading ? <BarLoader /> : 'Delete'}
          </Button>
        </div>
        {msg && (
          <Label
            as='label'
            colorSet={msg.includes('success') ? 'positive' : 'destructive'}
            colorName='lowContrast'
          >
            {msg}
          </Label>
        )}
      </div>
    </Dialog>
  );
}
