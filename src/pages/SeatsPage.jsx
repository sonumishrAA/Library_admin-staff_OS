// ─────────────────────────────────────────────────────────────
// SeatsPage.jsx — Visual seat map for the library
//
// Data source: contextData.seat_map from get-library-context
// Each seat has: seat_number, gender, occupants[]
// Each occupant has: student_name, shift_label, locker_number,
//                    ends_on, membership_id
//
// CONFLICT DETECTION (line ~110):
// - Groups occupants by shift_label
// - If 2+ students share the same base shift on the same seat
//   → Shows a red "Conflict in Morning Shift" warning
// - This is a DISPLAY-ONLY check — the real conflict prevention
//   happens in the backend via expandToBaseShiftIds()
//
// SEAT CHANGE:
// - Owner/staff can reassign a student to a different seat
// - Calls change-seat edge function which validates availability
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import { useShellContext } from '../components/useShellContext';
import { useAuth } from '../context/AuthContext';
import { portalApi } from '../lib/api';

export default function SeatsPage() {
  const { contextData, refreshContext } = useShellContext();
  const { token } = useAuth();
  const [studentId, setStudentId] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const seatOptions = useMemo(
    () => (contextData.seat_map || []).filter((seat) => !(seat.occupants || []).length).map((seat) => seat.seat_number),
    [contextData],
  );

  const submitSeatChange = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await portalApi.changeSeat(token, {
        library_id: contextData.library.id,
        student_id: studentId,
        seat_number: seatNumber,
      });
      toast.success('Seat updated');
      setStudentId('');
      setSeatNumber('');
      refreshContext();
    } catch (err) {
      toast.error(err.message || 'Failed to update seat');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack-page">
      <PageHeader
        eyebrow="Seat map"
        title="Visualize occupancy by seat, shift, expiry, and locker without switching screens."
        description="Empty seats remain obvious, and seat changes still go through backend validation."
      />

      <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
        <article className="panel panel--map" style={{ padding: 24 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
            alignItems: 'start'
          }}>
            {[...(contextData.seat_map || [])]
              .sort((a, b) => {
                const parseSeat = (s) => {
                  const match = String(s).match(/^([a-zA-Z]+)(\d+)/);
                  if (match) return { type: match[1].toUpperCase(), num: parseInt(match[2], 10) };
                  return { type: 'Z', num: 99999 };
                };
                const aSeat = parseSeat(a.seat_number);
                const bSeat = parseSeat(b.seat_number);
                if (aSeat.type !== bSeat.type) return aSeat.type.localeCompare(bSeat.type);
                return aSeat.num - bSeat.num;
              })
              .map((seat) => (
              <div 
                className={`seat-tile ${(seat.occupants || []).length ? 'seat-tile--occupied' : 'seat-tile--empty'}`} 
                key={seat.seat_number}
                style={{
                  minHeight: 'auto',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ fontSize: '1.4rem', color: 'var(--navy)', lineHeight: 1 }}>{seat.seat_number}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {seat.gender || 'Any Gender'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(seat.occupants || []).length ? (() => {
                    // Group occupants by shift to detect conflicts
                    const shiftGroups = {};
                    seat.occupants.forEach(occ => {
                      if (!shiftGroups[occ.shift_label]) shiftGroups[occ.shift_label] = [];
                      shiftGroups[occ.shift_label].push(occ);
                    });

                    return Object.entries(shiftGroups).map(([shiftLabel, occupantsInShift]) => {
                      const hasConflict = occupantsInShift.length > 1;

                      return (
                        <div key={shiftLabel} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {hasConflict && (
                            <div style={{ 
                              background: '#fef2f2', 
                              color: '#dc2626', 
                              fontSize: '0.75rem', 
                              fontWeight: 600, 
                              padding: '4px 8px', 
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              border: '1px solid #fca5a5'
                            }}>
                              <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>warning</span>
                              Conflict in {shiftLabel} Shift
                            </div>
                          )}
                          
                          {occupantsInShift.map((occupant) => (
                            <div 
                              key={`${seat.seat_number}-${occupant.membership_id}`} 
                              style={{ 
                                padding: '10px 12px', 
                                background: hasConflict ? '#fef2f2' : 'rgba(255,255,255,0.9)', 
                                borderRadius: '6px',
                                border: hasConflict ? '1px solid #fecaca' : '1px solid rgba(15, 39, 69, 0.05)'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <b style={{ fontSize: '0.9rem', color: hasConflict ? '#991b1b' : 'var(--navy)' }}>{occupant.student_name}</b>
                                <span style={{ 
                                  fontSize: '0.7rem', 
                                  padding: '2px 6px', 
                                  background: hasConflict ? '#fee2e2' : 'var(--orange-soft)', 
                                  color: hasConflict ? '#991b1b' : 'var(--navy)', 
                                  borderRadius: '4px',
                                  fontWeight: 600
                                }}>
                                  {occupant.shift_label}
                                </span>
                              </div>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                                <span style={{ color: hasConflict ? '#b91c1c' : 'var(--muted)' }}>
                                  <span className="material-symbols-rounded" style={{ fontSize: '11px', verticalAlign: '-1px', marginRight: '2px' }}>key</span>
                                  {occupant.locker_number || 'None'}
                                </span>
                                <span style={{ color: 'var(--red)', fontWeight: 500 }}>
                                  <span className="material-symbols-rounded" style={{ fontSize: '11px', verticalAlign: '-1px', marginRight: '2px' }}>event_busy</span>
                                  {occupant.ends_on || 'Not set'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    });
                  })() : (
                    <div style={{ 
                      padding: '16px', 
                      background: 'rgba(52, 211, 153, 0.05)', 
                      border: '1px dashed rgba(52, 211, 153, 0.4)', 
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}>
                      <span className="material-symbols-rounded" style={{ color: 'var(--green)', fontSize: '16px' }}>event_available</span>
                      <small style={{ color: 'var(--green)', fontSize: '0.85rem', fontWeight: 600 }}>Vacant all shifts</small>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
