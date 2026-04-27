import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createNotifyRule,
  buildPayload,
  formatPayload,
  matchingRules,
  notify,
  NotifyRule,
} from './notify';

describe('createNotifyRule', () => {
  it('creates a rule with expected defaults', () => {
    const rule = createNotifyRule('snapshot:created', 'console');
    expect(rule.event).toBe('snapshot:created');
    expect(rule.channel).toBe('console');
    expect(rule.enabled).toBe(true);
    expect(rule.id).toHaveLength(8);
  });

  it('stores destination for file channel', () => {
    const rule = createNotifyRule('snapshot:deleted', 'file', '/tmp/notify.log');
    expect(rule.destination).toBe('/tmp/notify.log');
  });
});

describe('buildPayload', () => {
  it('builds a payload with meta', () => {
    const p = buildPayload('snapshot:restored', 'prod', { user: 'alice' });
    expect(p.event).toBe('snapshot:restored');
    expect(p.snapshotName).toBe('prod');
    expect(p.meta).toEqual({ user: 'alice' });
  });
});

describe('formatPayload', () => {
  it('formats without meta', () => {
    const p = buildPayload('snapshot:locked', 'dev');
    const out = formatPayload(p);
    expect(out).toContain('[snapenv]');
    expect(out).toContain('snapshot:locked');
    expect(out).toContain('dev');
  });

  it('includes meta in output', () => {
    const p = buildPayload('snapshot:expired', 'staging', { reason: 'ttl' });
    const out = formatPayload(p);
    expect(out).toContain('reason=ttl');
  });
});

describe('matchingRules', () => {
  const rules: NotifyRule[] = [
    createNotifyRule('snapshot:created', 'console'),
    { ...createNotifyRule('snapshot:deleted', 'console'), enabled: false },
    createNotifyRule('snapshot:created', 'file', '/tmp/x.log'),
  ];

  it('returns only enabled rules for the event', () => {
    const matched = matchingRules(rules, 'snapshot:created');
    expect(matched).toHaveLength(2);
  });

  it('excludes disabled rules', () => {
    const matched = matchingRules(rules, 'snapshot:deleted');
    expect(matched).toHaveLength(0);
  });
});

describe('notify', () => {
  it('calls console.log for console channel', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const rules: NotifyRule[] = [createNotifyRule('snapshot:created', 'console')];
    await notify(rules, 'snapshot:created', 'mysnap');
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it('does nothing when no rules match', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const rules: NotifyRule[] = [createNotifyRule('snapshot:deleted', 'console')];
    await notify(rules, 'snapshot:created', 'mysnap');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
