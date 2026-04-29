import {
  createReminder,
  checkReminder,
  markTriggered,
  filterDueReminders,
  formatReminderList,
  ReminderRule,
} from './reminder';

const NOW = new Date('2024-06-15T12:00:00Z');

function makeRule(overrides: Partial<ReminderRule> = {}): ReminderRule {
  return {
    id: 'test-1',
    snapshotName: 'prod',
    message: 'Review prod env',
    intervalDays: 7,
    enabled: true,
    ...overrides,
  };
}

describe('createReminder', () => {
  it('creates a rule with enabled=true and no lastTriggered', () => {
    const r = createReminder('dev', 'Check dev vars', 14);
    expect(r.snapshotName).toBe('dev');
    expect(r.intervalDays).toBe(14);
    expect(r.enabled).toBe(true);
    expect(r.lastTriggered).toBeUndefined();
  });
});

describe('checkReminder', () => {
  it('marks due when never triggered', () => {
    const r = makeRule();
    const result = checkReminder(r, NOW);
    expect(result.isDue).toBe(true);
    expect(result.daysSinceLast).toBeNull();
  });

  it('marks due when interval exceeded', () => {
    const r = makeRule({ lastTriggered: '2024-06-07T00:00:00Z' }); // 8 days ago
    const result = checkReminder(r, NOW);
    expect(result.isDue).toBe(true);
    expect(result.daysSinceLast).toBe(8);
    expect(result.daysUntilNext).toBe(0);
  });

  it('marks not due when within interval', () => {
    const r = makeRule({ lastTriggered: '2024-06-12T00:00:00Z' }); // 3 days ago
    const result = checkReminder(r, NOW);
    expect(result.isDue).toBe(false);
    expect(result.daysUntilNext).toBe(4);
  });

  it('marks not due when disabled', () => {
    const r = makeRule({ enabled: false });
    const result = checkReminder(r, NOW);
    expect(result.isDue).toBe(false);
  });
});

describe('markTriggered', () => {
  it('sets lastTriggered to now', () => {
    const r = makeRule();
    const updated = markTriggered(r, NOW);
    expect(updated.lastTriggered).toBe(NOW.toISOString());
  });
});

describe('filterDueReminders', () => {
  it('returns only due reminders', () => {
    const rules = [
      makeRule({ id: 'a' }),
      makeRule({ id: 'b', lastTriggered: '2024-06-14T00:00:00Z' }),
    ];
    const due = filterDueReminders(rules, NOW);
    expect(due.length).toBe(1);
    expect(due[0].rule.id).toBe('a');
  });
});

describe('formatReminderList', () => {
  it('returns message when empty', () => {
    expect(formatReminderList([])).toBe('No reminders configured.');
  });

  it('includes DUE label for overdue reminders', () => {
    const r = makeRule();
    const output = formatReminderList([r], NOW);
    expect(output).toContain('[DUE]');
    expect(output).toContain('prod');
  });
});
