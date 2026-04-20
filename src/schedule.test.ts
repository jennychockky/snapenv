import {
  addSchedule,
  removeSchedule,
  enableSchedule,
  disableSchedule,
  listSchedules,
  formatSchedule,
  isDueCron,
  ScheduleMap,
} from './schedule';

const base: ScheduleMap = {};

describe('addSchedule', () => {
  it('adds a new enabled schedule', () => {
    const result = addSchedule(base, 'nightly', {
      snapshotName: 'prod',
      cron: '0 2 * * *',
      action: 'capture',
    });
    expect(result['nightly'].enabled).toBe(true);
    expect(result['nightly'].snapshotName).toBe('prod');
  });
});

describe('removeSchedule', () => {
  it('removes an existing schedule', () => {
    const map = addSchedule(base, 'nightly', { snapshotName: 'prod', cron: '0 2 * * *', action: 'capture' });
    const result = removeSchedule(map, 'nightly');
    expect(result['nightly']).toBeUndefined();
  });
});

describe('enableSchedule / disableSchedule', () => {
  it('toggles enabled flag', () => {
    let map = addSchedule(base, 's1', { snapshotName: 'dev', cron: '* * * * *', action: 'apply' });
    map = disableSchedule(map, 's1');
    expect(map['s1'].enabled).toBe(false);
    map = enableSchedule(map, 's1');
    expect(map['s1'].enabled).toBe(true);
  });

  it('throws if schedule not found', () => {
    expect(() => enableSchedule(base, 'missing')).toThrow("Schedule 'missing' not found");
    expect(() => disableSchedule(base, 'missing')).toThrow("Schedule 'missing' not found");
  });
});

describe('listSchedules', () => {
  it('returns all schedule entries', () => {
    const map = addSchedule(addSchedule(base, 'a', { snapshotName: 'x', cron: '* * * * *', action: 'apply' }), 'b', { snapshotName: 'y', cron: '0 0 * * *', action: 'capture' });
    expect(listSchedules(map)).toHaveLength(2);
  });
});

describe('formatSchedule', () => {
  it('formats a schedule entry', () => {
    const entry = { snapshotName: 'prod', cron: '0 2 * * *', action: 'capture' as const, enabled: true };
    const out = formatSchedule(entry);
    expect(out).toContain('prod');
    expect(out).toContain('enabled');
    expect(out).toContain('never run');
  });
});

describe('isDueCron', () => {
  it('matches wildcard cron', () => {
    expect(isDueCron('* * * * *', new Date())).toBe(true);
  });

  it('does not match wrong minute', () => {
    const now = new Date();
    const wrongMin = (now.getMinutes() + 1) % 60;
    expect(isDueCron(`${wrongMin} * * * *`, now)).toBe(false);
  });

  it('returns false for invalid cron', () => {
    expect(isDueCron('bad cron string')).toBe(false);
  });
});
