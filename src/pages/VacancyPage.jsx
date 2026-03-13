import { useMemo } from 'react';
import { useShellContext } from '../components/useShellContext';
import PageHeader from '../components/PageHeader';
import { useNavigate } from 'react-router-dom';

export default function VacancyPage() {
  const { contextData } = useShellContext();
  const navigate = useNavigate();

  const vacantData = useMemo(() => {
    if (!contextData) return { vacantSeats: [], vacantLockers: [], totalShifts: 0 };

    const activeStudents = contextData.students || [];
    const shifts = contextData.shifts || [];
    const allSeats = (contextData.seats || []).map(s => s?.seat_number || s);
    const totalShifts = shifts.length;

    // Track which seat is occupied in which shift
    const seatOccupancy = {};
    allSeats.forEach(seat => {
      seatOccupancy[seat] = new Set();
    });

    activeStudents.forEach(student => {
      if (student.seat_number && seatOccupancy[student.seat_number]) {
        student.shift_labels.forEach(shiftLabel => {
          seatOccupancy[student.seat_number].add(shiftLabel);
        });
      }
    });

    // Determine vacant shifts per seat
    const vacantSeats = [];
    allSeats.forEach(seat => {
      const occupiedShifts = seatOccupancy[seat] || new Set();
      const vacantShifts = shifts
        .map(s => s.label)
        .filter(shiftLabel => !occupiedShifts.has(shiftLabel));

      if (vacantShifts.length > 0) {
        vacantSeats.push({
          seat,
          vacantShifts,
          allVacant: vacantShifts.length === totalShifts
        });
      }
    });

    // Sort seats alphanumerically
    vacantSeats.sort((a, b) => {
      const parseSeat = (s) => {
        const match = String(s).match(/^([a-zA-Z]+)(\d+)/);
        if (match) return { type: match[1].toUpperCase(), num: parseInt(match[2], 10) };
        return { type: 'Z', num: 99999 };
      };
      const aSeat = parseSeat(a.seat);
      const bSeat = parseSeat(b.seat);
      if (aSeat.type !== bSeat.type) return aSeat.type.localeCompare(bSeat.type);
      return aSeat.num - bSeat.num;
    });

    // Find vacant lockers
    const occupiedLockers = new Set(
      activeStudents.map(s => s.locker_number).filter(Boolean)
    );
    const allLockers = (contextData.lockers || []).map(l => l?.locker_number || l);
    const vacantLockers = allLockers
      .filter(l => l && !occupiedLockers.has(l))
      .sort((a, b) => {
        const parseLocker = (l) => {
          const match = String(l).match(/^([a-zA-Z]+)(\d+)/);
          if (match) return { type: match[1].toUpperCase(), num: parseInt(match[2], 10) };
          return { type: 'Z', num: 99999 };
        };
        const aL = parseLocker(a);
        const bL = parseLocker(b);
        if (aL.type !== bL.type) return aL.type.localeCompare(bL.type);
        return aL.num - bL.num;
      });

    return { vacantSeats, vacantLockers, totalShifts };
  }, [contextData]);

  if (!contextData) return null;

  return (
    <div className="stack-page">
      <div className="button-row">
        <button type="button" className="ghost-button" onClick={() => navigate(-1)}>
          &larr; Back to Dashboard
        </button>
      </div>

      <PageHeader
        eyebrow="Availability"
        title="Vacant Seats & Lockers"
        description="See exactly which shifts are empty for each seat."
      />

      <div className="dashboard-grid dashboard-grid--wide">
        <article className="panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Vacant Seats</h3>
            <span className="status-badge status-badge--success">{vacantData.vacantSeats.length} seats have vacancies</span>
          </div>

          {vacantData.vacantSeats.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span className="material-symbols-rounded" style={{ color: '#94a3b8', fontSize: '32px', marginBottom: '8px' }}>event_busy</span>
              <p style={{ margin: 0, color: '#475569', fontWeight: 600 }}>No vacant seats</p>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>All seats are fully booked across all shifts.</p>
            </div>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '12px', overflowX: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {vacantData.vacantSeats.map(({ seat, vacantShifts, allVacant }) => (
                  <div key={seat} style={{ 
                    padding: '14px', 
                    background: '#fff', 
                    borderRadius: '10px', 
                    border: allVacant ? '1px solid #34d399' : '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '1.2rem', color: '#0f1f33' }}>{seat}</strong>
                      {allVacant && <span className="status-badge status-badge--success" style={{ fontSize: '0.7rem' }}>All shifts vacant</span>}
                    </div>
                    
                    {!allVacant && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {vacantShifts.map(shift => (
                          <span key={shift} style={{ 
                            fontSize: '0.75rem', 
                            padding: '3px 8px', 
                            background: '#f1f5f9', 
                            color: '#475569', 
                            borderRadius: '4px',
                            fontWeight: 500
                          }}>
                            {shift}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>

        <article className="panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Vacant Lockers</h3>
            <span className="status-badge status-badge--success">{vacantData.vacantLockers.length} available</span>
          </div>
          
          {vacantData.vacantLockers.length > 0 && vacantData.vacantLockers.length === (contextData.lockers || []).length ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', background: '#eef2ff', borderRadius: '8px', border: '1px dashed #c7d2fe' }}>
              <span className="material-symbols-rounded" style={{ color: '#4f46e5', fontSize: '28px', marginBottom: '8px' }}>check_circle</span>
              <p style={{ margin: 0, color: '#4338ca', fontWeight: 600 }}>All lockers are vacant!</p>
              <p style={{ margin: '4px 0 0', color: '#6366f1', fontSize: '0.85rem' }}>All {vacantData.vacantLockers.length} lockers are available.</p>
            </div>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '8px', overflowX: 'hidden' }}>
              <div className="seat-map-grid" style={{ maxHeight: 'none', gap: 8 }}>
                {vacantData.vacantLockers.length ? vacantData.vacantLockers.map(locker => (
                  <div key={locker} className="seat-tile seat-tile--empty" style={{ minHeight: 'auto', padding: '10px' }}>
                    <strong>{locker}</strong>
                  </div>
                )) : <p className="muted-copy" style={{ margin: 0, gridColumn: '1 / -1' }}>No vacant lockers.</p>}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
