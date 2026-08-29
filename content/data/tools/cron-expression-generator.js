module.exports = {
  slug: 'cron-expression-generator',
  title: 'Cron Expression Generator & Parser (with Next Runs)',
  h1: 'Cron Expression Generator',
  eyebrow: 'Developer tool',
  description:
    'Build or decode a cron schedule, read it in plain English, and see the next ten times it will actually fire. Free and entirely browser-based.',
  standfirst:
    'Write a cron expression and get a plain-English description plus the next ten run times — the fastest way to prove a schedule does what you meant.',
  keywords: ['cron expression generator', 'crontab generator', 'cron parser', 'cron schedule', 'cron next run time'],
  published: '2026-04-16',
  updated: '2026-08-23',
  author: 'jackson',

  tool: {
    html: `
<div class="jp-tool">
  <div class="jp-field">
    <label for="cr-expr">Cron expression</label>
    <input class="jp-input" type="text" id="cr-expr" value="30 3 * * 1-5" spellcheck="false"
      style="font-family:var(--mono);font-size:1.1rem" />
    <span class="jp-hint">Five fields: minute, hour, day of month, month, day of week.</span>
  </div>

  <div class="jp-field">
    <span class="jp-field-legend" id="cr-presets-label">Common schedules</span>
    <div class="jp-chips" id="cr-presets" role="group" aria-labelledby="cr-presets-label"></div>
  </div>

  <div class="jp-tool-grid" id="cr-fields"></div>

  <p class="jp-status" id="cr-status" role="status" aria-live="polite">&nbsp;</p>

  <div class="jp-stat jp-stat--primary" style="margin:1rem 0">
    <p class="jp-stat-label">In plain English</p>
    <p class="jp-stat-value" id="cr-human" style="font-size:1.15rem;line-height:1.4">—</p>
  </div>

  <h2 class="jp-tool-h">Next ten runs <span style="font-weight:400;color:var(--text-mute);font-size:.85rem">(your local time)</span></h2>
  <pre class="jp-out" id="cr-next"></pre>
</div>`,

    js: `
(function () {
  var expr = document.getElementById('cr-expr');
  var status = document.getElementById('cr-status');
  var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  var FIELDS = [
    { name: 'Minute', min: 0, max: 59 },
    { name: 'Hour', min: 0, max: 23 },
    { name: 'Day of month', min: 1, max: 31 },
    { name: 'Month', min: 1, max: 12 },
    { name: 'Day of week', min: 0, max: 6 }
  ];

  var PRESETS = [
    ['Every minute', '* * * * *'],
    ['Every 5 minutes', '*/5 * * * *'],
    ['Every 15 minutes', '*/15 * * * *'],
    ['Hourly', '0 * * * *'],
    ['Daily at 03:30', '30 3 * * *'],
    ['Weekdays 09:00', '0 9 * * 1-5'],
    ['Weekly, Sunday midnight', '0 0 * * 0'],
    ['Monthly, 1st at 02:00', '0 2 1 * *'],
    ['Quarterly', '0 0 1 1,4,7,10 *'],
    ['Twice daily', '0 6,18 * * *']
  ];

  var ALIASES = {
    jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
    sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6
  };

  /* Expand one field into the explicit set of values it permits. */
  function expand(spec, field) {
    var values = [];
    spec.split(',').forEach(function (part) {
      var step = 1;
      var slash = part.split('/');
      if (slash.length === 2) { part = slash[0]; step = parseInt(slash[1], 10); }
      if (!(step >= 1)) throw new Error('Step in "' + spec + '" must be a positive number');

      var from, to;
      if (part === '*') {
        from = field.min; to = field.max;
      } else {
        var range = part.split('-').map(function (token) {
          var t = token.toLowerCase();
          var n = ALIASES[t] !== undefined ? ALIASES[t] : parseInt(t, 10);
          if (isNaN(n)) throw new Error('"' + token + '" is not valid in the ' + field.name.toLowerCase() + ' field');
          return n;
        });
        from = range[0];
        to = range.length > 1 ? range[1] : (slash.length === 2 ? field.max : range[0]);
      }

      if (from < field.min || to > field.max) {
        throw new Error(field.name + ' must be between ' + field.min + ' and ' + field.max);
      }
      for (var v = from; v <= to; v += step) values.push(v === 7 && field.max === 6 ? 0 : v);
    });
    return values.filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
  }

  function list(values, names) {
    var labelled = names ? values.map(function (v) { return names[v]; }) : values;
    if (labelled.length === 1) return String(labelled[0]);
    return labelled.slice(0, -1).join(', ') + ' and ' + labelled[labelled.length - 1];
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function describe(parts, sets) {
    var minute = parts[0], hour = parts[1], dom = parts[2], month = parts[3], dow = parts[4];

    var time;
    if (minute === '*' && hour === '*') time = 'Every minute';
    else if (hour === '*' && /^\\*\\//.test(minute)) time = 'Every ' + minute.slice(2) + ' minutes';
    else if (hour === '*') time = 'At ' + list(sets[0].map(function (m) { return 'minute ' + m; }));
    else if (minute === '*') time = 'Every minute during hour ' + list(sets[1]);
    else {
      var times = [];
      sets[1].forEach(function (h) { sets[0].forEach(function (m) { times.push(pad(h) + ':' + pad(m)); }); });
      time = 'At ' + (times.length > 6 ? times.length + ' times a day' : list(times));
    }

    var day = '';
    if (dom !== '*' && dow !== '*') {
      day = ' on day ' + list(sets[2]) + ' of the month, and on ' + list(sets[4], DAYS) +
        ' (cron treats these as OR, not AND)';
    } else if (dom !== '*') {
      day = ' on day ' + list(sets[2]) + ' of the month';
    } else if (dow !== '*') {
      day = ' on ' + list(sets[4], DAYS);
    } else {
      day = ' every day';
    }

    var when = month === '*' ? '' : ' in ' + list(sets[3].map(function (m) { return m - 1; }), MONTHS);
    return time + day + when + '.';
  }

  function matches(date, sets, parts) {
    var domRestricted = parts[2] !== '*';
    var dowRestricted = parts[4] !== '*';
    var dayOk;
    if (domRestricted && dowRestricted) {
      dayOk = sets[2].indexOf(date.getDate()) !== -1 || sets[4].indexOf(date.getDay()) !== -1;
    } else if (domRestricted) {
      dayOk = sets[2].indexOf(date.getDate()) !== -1;
    } else if (dowRestricted) {
      dayOk = sets[4].indexOf(date.getDay()) !== -1;
    } else {
      dayOk = true;
    }
    return sets[0].indexOf(date.getMinutes()) !== -1 &&
           sets[1].indexOf(date.getHours()) !== -1 &&
           sets[3].indexOf(date.getMonth() + 1) !== -1 &&
           dayOk;
  }

  function nextRuns(sets, parts, count) {
    var runs = [];
    var cursor = new Date();
    cursor.setSeconds(0, 0);
    cursor.setMinutes(cursor.getMinutes() + 1);
    // Four years of minutes is enough to prove even a 29 February schedule.
    for (var i = 0; i < 2103840 && runs.length < count; i++) {
      if (matches(cursor, sets, parts)) runs.push(new Date(cursor));
      cursor.setMinutes(cursor.getMinutes() + 1);
    }
    return runs;
  }

  function render() {
    var raw = expr.value.trim().replace(/\\s+/g, ' ');
    var parts = raw.split(' ');

    if (parts.length !== 5) {
      status.textContent = 'Expected 5 fields, found ' + parts.length +
        (parts.length === 6 ? ' — six-field expressions include seconds and are used by Quartz and Spring, not standard cron.' : '.');
      status.className = 'jp-status jp-status--err';
      document.getElementById('cr-human').textContent = '—';
      document.getElementById('cr-next').textContent = '';
      return;
    }

    var sets;
    try {
      sets = FIELDS.map(function (field, i) { return expand(parts[i], field); });
      if (sets.some(function (s) { return !s.length; })) throw new Error('A field resolved to no values');
    } catch (error) {
      status.textContent = error.message;
      status.className = 'jp-status jp-status--err';
      document.getElementById('cr-human').textContent = '—';
      document.getElementById('cr-next').textContent = '';
      return;
    }

    status.textContent = 'Valid expression';
    status.className = 'jp-status jp-status--ok';
    document.getElementById('cr-human').textContent = describe(parts, sets);

    document.getElementById('cr-fields').innerHTML = FIELDS.map(function (field, i) {
      var values = sets[i];
      var shown = values.length > 12 ? values.slice(0, 12).join(', ') + ' …' : values.join(', ');
      return '<div class="jp-stat"><p class="jp-stat-label">' + field.name + ' &nbsp;<code>' + parts[i] +
        '</code></p><p class="jp-stat-sub" style="margin-top:.3rem">' + shown + '</p></div>';
    }).join('');

    var runs = nextRuns(sets, parts, 10);
    document.getElementById('cr-next').textContent = runs.length
      ? runs.map(function (d) {
          return d.toLocaleString(undefined, {
            weekday: 'short', year: 'numeric', month: 'short', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: false
          });
        }).join('\\n')
      : 'This expression never fires — check for an impossible date such as 31 February.';
  }

  document.getElementById('cr-presets').innerHTML = PRESETS.map(function (p, i) {
    return '<button class="jp-chip" type="button" data-preset="' + i + '">' + p[0] + '</button>';
  }).join('');
  document.getElementById('cr-presets').addEventListener('click', function (event) {
    var button = event.target.closest('[data-preset]');
    if (!button) return;
    expr.value = PRESETS[+button.getAttribute('data-preset')][1];
    render();
  });

  expr.addEventListener('input', render);
  render();
})();`,
  },

  blocks: [
    { t: 'h2', x: 'How to read the five fields' },
    {
      t: 'code',
      lang: 'text',
      x: `┌───────────── minute        (0 – 59)
│ ┌─────────── hour          (0 – 23)
│ │ ┌───────── day of month  (1 – 31)
│ │ │ ┌─────── month         (1 – 12 or JAN – DEC)
│ │ │ │ ┌───── day of week   (0 – 6, Sunday = 0, or SUN – SAT)
│ │ │ │ │
30 3 * * 1-5     → 03:30, Monday to Friday`,
    },
    {
      t: 'table',
      head: ['Operator', 'Meaning', 'Example'],
      rows: [
        ['`*`', 'Every value', '`* * * * *` — every minute'],
        ['`,`', 'A list', '`0 6,18 * * *` — 06:00 and 18:00'],
        ['`-`', 'A range', '`0 9-17 * * *` — hourly, 09:00 to 17:00'],
        ['`/`', 'A step', '`*/15 * * * *` — every 15 minutes'],
        ['`L`', 'Last (extension)', '`0 0 L * *` — last day of the month, not in standard cron'],
      ],
    },

    {
      t: 'note',
      kind: 'warn',
      title: 'The trap that catches everyone: day-of-month and day-of-week are OR, not AND',
      x: 'When **both** fields are restricted, cron fires if *either* matches. `0 0 1 * 1` does not mean "the 1st, if it is a Monday" — it means "every 1st of the month **and** every Monday". To get the AND behaviour, restrict one field in cron and check the other inside your script.',
    },

    { t: 'h2', x: 'Steps do not mean "every N from now"' },
    {
      t: 'p',
      x: '`*/20 * * * *` fires at :00, :20 and :40 — it steps through the *field’s own range* starting at zero, not from the moment you installed the job. This matters at boundaries: `*/45` gives you :00 and :45, then jumps back to :00 the following hour, so the gap between the second and third run is 15 minutes, not 45.',
    },
    {
      t: 'p',
      x: 'If you genuinely need an even interval that does not divide the hour, run more frequently and gate inside the job, or use a scheduler with real interval support such as systemd timers.',
    },

    { t: 'h2', x: 'Which timezone does cron use?' },
    {
      t: 'p',
      x: 'System crontabs run in the **server’s** timezone, which on most cloud instances is UTC. This is the single most common cause of "my job ran at the wrong time" — the schedule was written in local time and the box was never in that timezone.',
    },
    {
      t: 'ul',
      items: [
        '**Set it explicitly.** `CRON_TZ=Europe/London` at the top of a crontab (Vixie cron) or `TZ=` in some implementations pins the schedule.',
        '**Kubernetes CronJobs** support a `.spec.timeZone` field from v1.27. Without it, they follow the controller manager’s timezone.',
        '**Avoid 01:00–03:00 for daily jobs.** In a spring-forward transition that hour does not exist, so the job is skipped; in autumn it happens twice, so the job runs twice. Schedule at 04:00 and the problem disappears.',
      ],
    },

    { t: 'h2', x: 'Six-field expressions are a different thing' },
    {
      t: 'p',
      x: 'Quartz, Spring’s `@Scheduled` and several cloud schedulers use six fields, adding **seconds** at the front. AWS EventBridge uses six fields too, but the extra one is a **year** at the end, and it requires `?` in one of the day fields rather than `*`.',
    },
    {
      t: 'code',
      lang: 'text',
      x: `Standard (5)      30 3 * * 1-5          03:30 on weekdays
Quartz (6)      0 30 3 ? * MON-FRI      leading seconds, ? for unused day field
EventBridge     30 3 ? * MON-FRI *      trailing year`,
    },
    { t: 'p', x: 'Pasting one flavour into another is a reliable way to produce a job that silently never runs. This tool validates the standard five-field form.' },

    { t: 'h2', x: 'Writing crontab entries that do not fail silently' },
    {
      t: 'code',
      lang: 'bash',
      x: `# Edit the current user's crontab
crontab -e

# List it
crontab -l

# Redirect output — cron mails it otherwise, and on most servers
# that mail goes nowhere and the failure is invisible.
30 3 * * 1-5 /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1

# Percent signs are special in crontab and must be escaped
0 4 * * * /usr/bin/pg_dump db > /backups/db-$(date +\\%Y\\%m\\%d).sql`,
    },
    {
      t: 'ul',
      items: [
        '**Use absolute paths.** Cron runs with a minimal `PATH` — usually just `/usr/bin:/bin`. A script that works in your shell will fail under cron because a binary is not on that path.',
        '**Your environment is not loaded.** No `.bashrc`, no `.profile`, no `nvm`, no virtualenv. Source what you need explicitly at the top of the script.',
        '**Escape `%`.** In a crontab it means newline. An unescaped `date +%Y` truncates the command at that point.',
        '**End the file with a newline.** Some cron implementations silently ignore a final line without one.',
        '**Guard against overlap.** If a job can outrun its interval, wrap it in `flock -n /tmp/job.lock` so a slow run does not stack up behind itself.',
      ],
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Add a dead-man’s switch',
      x: 'Cron tells you nothing when a job fails to run at all — a deleted crontab, a full disk or a rebooted box is completely silent. Have the job ping a monitoring endpoint on success and alert when the ping stops. That is the difference between noticing a broken backup today and noticing it during a restore.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'What does 30 3 * * 1-5 mean?',
          a: 'It runs at 03:30 every Monday through Friday, in every month. The first field is the minute, the second the hour, and 1-5 in the day-of-week field covers Monday to Friday.',
        },
        {
          q: 'Why has my cron job never run?',
          a: 'In order of likelihood: the command uses a relative path that is not on cron’s minimal PATH; the script is not executable; the crontab file has no trailing newline; the schedule is in a different timezone than you assumed; or an unescaped % truncated the command. Redirect output to a log file and the cause is usually obvious in seconds.',
        },
        {
          q: 'How do I run something every 30 seconds?',
          a: 'Standard cron cannot — one minute is its finest granularity. Either run every minute and have the script sleep 30 seconds before a second pass, or use systemd timers, which support sub-minute intervals properly.',
        },
        {
          q: 'Is 0 the same as 7 for Sunday?',
          a: 'In most implementations, yes — both mean Sunday, an allowance for the two conventions in circulation. The tool above normalises 7 to 0. Using 0 is safer, since not every scheduler accepts 7.',
        },
        {
          q: 'What happens to a job scheduled during a daylight-saving change?',
          a: 'Behaviour varies by implementation and is genuinely inconsistent. Vixie cron tries to run jobs skipped by a spring-forward, and may suppress duplicate runs in autumn — but do not rely on it. Schedule anything important outside the 01:00–03:00 window, or run the server in UTC.',
        },
      ],
    },
  ],

  related: ['/tools/regex-tester/', '/guides/docker-container-exits-immediately/', '/tools/uuid-generator/'],
};
