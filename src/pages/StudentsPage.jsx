import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useShellContext } from '../components/useShellContext';
import { formatDate } from '../lib/portal';

export default function StudentsPage() {
  const { contextData } = useShellContext();

  return (
    <div className="stack-page">
      <PageHeader
        eyebrow="Students"
        title="Track admissions, expiries, seat assignments, and locker coverage in one list."
        description="Expired students stay visible until renewed. Nothing is deleted from the operating view."
      />

      <div className="panel panel--table">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Shift</th>
              <th>Seat</th>
              <th>Locker</th>
              <th>Expiry</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {[...contextData.students]
              .sort((a, b) => {
                const parseSeat = (seat) => {
                  if (!seat) return { type: 'Z', num: 99999 };
                  const match = seat.match(/^([a-zA-Z]+)(\d+)/);
                  if (match) {
                    return { type: match[1].toUpperCase(), num: parseInt(match[2], 10) };
                  }
                  return { type: 'Z', num: 99999 };
                };

                const aSeat = parseSeat(a.seat_number);
                const bSeat = parseSeat(b.seat_number);

                if (aSeat.type !== bSeat.type) {
                  return aSeat.type.localeCompare(bSeat.type);
                }
                return aSeat.num - bSeat.num;
              })
              .map((student) => (
              <tr key={student.id}>
                <td>
                  <strong>{student.full_name}</strong>
                  <div className="cell-subcopy">{student.father_name || '—'}</div>
                </td>
                <td>{student.phone}</td>
                <td>{student.shift_labels.join(' + ') || 'Not set'}</td>
                <td>{student.seat_number || 'Auto'}</td>
                <td>{student.locker_number || '—'}</td>
                <td>{formatDate(student.current_end_date)}</td>
                <td>
                  <StatusBadge
                    label={student.is_expired ? 'Expired' : student.due_soon ? 'Due soon' : 'Active'}
                    tone={student.is_expired ? 'danger' : student.due_soon ? 'warning' : 'success'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
