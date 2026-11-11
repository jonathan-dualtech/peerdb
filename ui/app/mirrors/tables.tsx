'use client';
import DropDialog from '@/components/DropDialog';
import MirrorLink from '@/components/MirrorLink';
import NewButton from '@/components/NewButton';
import PeerButton from '@/components/PeerComponent';
import TimeLabel from '@/components/TimeComponent';
import { FlowStatus } from '@/grpc_generated/flow';
import { ListMirrorsItem } from '@/grpc_generated/route';
import { Badge } from '@/lib/Badge';
import { BadgeVariant } from '@/lib/Badge/Badge.styles';
import { Icon } from '@/lib/Icon';
import { Label } from '@/lib/Label';
import { ProgressCircle } from '@/lib/ProgressCircle';
import { Table, TableCell, TableRow } from '@/lib/Table';
import Link from 'next/link';
import { useTheme as useStyledTheme } from 'styled-components';
import { MirrorType } from '../dto/MirrorsDTO';
import { tableStyle } from '../peers/[peerName]/style';
import { FormatStatus } from '../utils/flowstatus';

function isDeletingStatus(status: FlowStatus) {
  return String(status) === 'STATUS_TERMINATING';
}

function MirrorStatusBadge({
  status,
  deleting,
}: {
  status: FlowStatus;
  deleting: boolean;
}) {
  if (deleting || isDeletingStatus(status)) {
    return (
      <Badge variant='destructive'>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ProgressCircle variant='determinate_progress_circle' />
          Deleting
        </span>
      </Badge>
    );
  }
  return (
    <Badge variant={getStatusVariant(status)}>{FormatStatus(status)}</Badge>
  );
}

function getStatusVariant(status: FlowStatus): BadgeVariant {
  const statusStr = status.toString();
  switch (statusStr) {
    case FlowStatus[FlowStatus.STATUS_RUNNING]:
      return 'positive';
    case FlowStatus[FlowStatus.STATUS_PAUSED]:
    case FlowStatus[FlowStatus.STATUS_PAUSING]:
      return 'warning';
    case FlowStatus[FlowStatus.STATUS_FAILED]:
    case FlowStatus[FlowStatus.STATUS_TERMINATED]:
    case FlowStatus[FlowStatus.STATUS_TERMINATING]:
      return 'destructive';
    default:
      return 'normal';
  }
}

export function CDCFlows({
  cdcFlows,
  deleting,
  onDeleting,
  onDeleteFailed,
}: {
  cdcFlows: ListMirrorsItem[];
  deleting: string[];
  onDeleting: (flowJobName: string) => void;
  onDeleteFailed: (flowJobName: string) => void;
}) {
  const styledTheme = useStyledTheme();
  if (cdcFlows?.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          rowGap: '1rem',
          width: 'fit-content',
        }}
      >
        <Label variant='headline'>Change-data capture</Label>
        <NewButton
          targetPage={`/mirrors/create?type=${MirrorType.CDC}`}
          buttonText={`Create your first CDC mirror`}
        />
      </div>
    );
  }

  return (
    <>
      <Label variant='headline'>Change-data capture</Label>
      <div style={tableStyle(styledTheme)}>
        <Table
          header={
            <TableRow>
              {[
                'Name',
                'Status',
                'Source',
                'Destination',
                'Start Time',
                'Logs',
                '',
              ].map((heading, index) => (
                <TableCell as='th' key={index}>
                  <Label as='label' style={{ fontWeight: 'bold' }}>
                    {heading}
                  </Label>
                </TableCell>
              ))}
            </TableRow>
          }
        >
          {cdcFlows.map((flow) => (
            <TableRow key={flow.id}>
              <TableCell variant='mirror_name'>
                <MirrorLink flowName={flow.name} />
              </TableCell>
              <TableCell>
                <MirrorStatusBadge
                  status={flow.status}
                  deleting={deleting.includes(flow.name)}
                />
              </TableCell>
              <TableCell>
                <PeerButton
                  peerName={flow.sourceName}
                  peerType={flow.sourceType}
                />
              </TableCell>
              <TableCell>
                <PeerButton
                  peerName={flow.destinationName}
                  peerType={flow.destinationType}
                />
              </TableCell>
              <TableCell>
                <TimeLabel timeVal={new Date(flow.createdAt)} />
              </TableCell>
              <TableCell>
                <Link href={`/mirrors/errors/${flow.name}`}>
                  <Icon name='description' />
                </Link>
              </TableCell>
              <TableCell>
                {deleting.includes(flow.name) ||
                isDeletingStatus(flow.status) ? null : (
                  <DropDialog
                    mode='MIRROR'
                    dropArgs={{
                      flowJobName: flow.name,
                    }}
                    onDeleting={onDeleting}
                    onDeleteFailed={onDeleteFailed}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </div>
    </>
  );
}

// query replication flows table like CDC flows table
export function QRepFlows({
  qrepFlows,
  title,
  deleting,
  onDeleting,
  onDeleteFailed,
}: {
  qrepFlows: ListMirrorsItem[];
  title: string;
  deleting: string[];
  onDeleting: (flowJobName: string) => void;
  onDeleteFailed: (flowJobName: string) => void;
}) {
  const styledTheme = useStyledTheme();
  if (qrepFlows?.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          rowGap: '1rem',
          width: 'fit-content',
        }}
      >
        <Label variant='headline'>{title}</Label>
        <NewButton
          targetPage={`/mirrors/create?type=${MirrorType.QRep}`}
          buttonText='Create your first query replication'
        />
      </div>
    );
  }

  return (
    <>
      <Label variant='headline'>{title}</Label>
      <div style={tableStyle(styledTheme)}>
        <Table
          header={
            <TableRow>
              {[
                'Name',
                'Status',
                'Source',
                'Destination',
                'Start Time',
                '',
              ].map((heading, index) => (
                <TableCell as='th' key={index}>
                  <Label as='label' style={{ fontWeight: 'bold' }}>
                    {heading}
                  </Label>
                </TableCell>
              ))}
            </TableRow>
          }
        >
          {qrepFlows.map((flow) => (
            <TableRow key={flow.id}>
              <TableCell variant='mirror_name'>
                <MirrorLink flowName={flow.name} />
              </TableCell>
              <TableCell>
                <MirrorStatusBadge
                  status={flow.status}
                  deleting={deleting.includes(flow.name)}
                />
              </TableCell>
              <TableCell>
                <PeerButton
                  peerName={flow.sourceName}
                  peerType={flow.sourceType}
                />
              </TableCell>
              <TableCell>
                <PeerButton
                  peerName={flow.destinationName}
                  peerType={flow.destinationType}
                />
              </TableCell>
              <TableCell>
                <TimeLabel timeVal={new Date(flow.createdAt)} />
              </TableCell>
              <TableCell>
                {deleting.includes(flow.name) ||
                isDeletingStatus(flow.status) ? null : (
                  <DropDialog
                    mode='MIRROR'
                    dropArgs={{
                      flowJobName: flow.name,
                    }}
                    onDeleting={onDeleting}
                    onDeleteFailed={onDeleteFailed}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </div>
    </>
  );
}
