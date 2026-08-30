module.exports = {
  slug: 'cron-expression-generator',
  title: 'Cron Expression Generator and Next Run Calculator',
  h1: 'Cron Expression Generator',
  eyebrow: 'Developer tool',
  description:
    'Build or parse a standard five-field cron expression, read its schedule and calculate the next ten runs in local time.',
  standfirst:
    'Enter a five-field cron expression to inspect each field, read a plain-language summary and check its next ten scheduled times.',
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
    <span class="jp-hint">Use five fields in this order: minute, hour, day of month, month and day of week.</span>
  </div>

  <div class="jp-field">
    <span class="jp-field-legend" id="cr-presets-label">Example schedules</span>
    <div class="jp-chips" id="cr-presets" role="group" aria-labelledby="cr-presets-label"></div>
  </div>

  <div class="jp-tool-grid" id="cr-fields"></div>

  <p class="jp-status" id="cr-status" role="status" aria-live="polite">&nbsp;</p>

  <div class="jp-stat jp-stat--primary" style="margin:1rem 0">
    <p class="jp-stat-label">Schedule summary</p>
    <p class="jp-stat-value" id="cr-human" style="font-size:1.15rem;line-height:1.4">Not available</p>
  </div>

  <h2 class="jp-tool-h">Next ten runs <span style="font-weight:400;color:var(--text-mute);font-size:.85rem">(browser local time)</span></h2>
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
    ['Weekdays at 09:00', '0 9 * * 1-5'],
    ['Every Sunday at 00:00', '0 0 * * 0'],
    ['First day of each month at 02:00', '0 2 1 * *'],
    ['First day of each quarter', '0 0 1 1,4,7,10 *'],
    ['Daily at 06:00 and 18:00', '0 6,18 * * *']
  ];

  var ALIASES = {
    jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
    sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6
  };

  /* Convert one field into its allowed values. */
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
    // Four years covers every possible 29 February schedule.
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
      status.textContent = 'Expected 5 fields but found ' + parts.length +
        (parts.length === 6 ? '. Quartz and Spring use six fields with seconds, but standard cron does not.' : '.');
      status.className = 'jp-status jp-status--err';
      document.getElementById('cr-human').textContent = 'Not available';
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
      document.getElementById('cr-human').textContent = 'Not available';
      document.getElementById('cr-next').textContent = '';
      return;
    }

    status.textContent = 'This is a valid five-field expression.';
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
      : 'No run was found in the search window. Check for an impossible date such as 31 February.';
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
    { t: 'h2', x: 'Reading the five fields' },
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
        ['`*`', 'Every value', '`* * * * *`: every minute'],
        ['`,`', 'A list', '`0 6,18 * * *`: 06:00 and 18:00'],
        ['`-`', 'A range', '`0 9-17 * * *`: hourly from 09:00 through 17:00'],
        ['`/`', 'A step', '`*/15 * * * *`: every 15 minutes'],
        ['`L`', 'Last (extension)', '`0 0 L * *`: last day of the month; not supported by standard cron'],
      ],
    },

    {
      t: 'note',
      kind: 'warn',
      title: 'Day of month and day of week use OR',
      x: 'When **both** day fields are restricted, standard cron runs when either field matches. `0 0 1 * 1` means every first day of the month plus every Monday, not only first days that fall on Monday. To require both conditions, restrict one field in cron and check the other in the command or script.',
    },

    { t: 'h2', x: 'Step values start at the field boundary' },
    {
      t: 'p',
      x: '`*/20 * * * *` runs at :00, :20 and :40 because the step starts at zero in the minute field. It does not start when the job is installed. Likewise, `*/45` runs at :00 and :45, followed by :00 in the next hour, so one interval is only 15 minutes.',
    },
    {
      t: 'p',
      x: 'For an even interval that does not divide the hour, run more frequently and check elapsed time inside the job, or use an interval-based scheduler such as a systemd timer.',
    },

    { t: 'h2', x: 'Which timezone does cron use?' },
    {
      t: 'p',
      x: 'A system crontab uses the **server’s** configured timezone, which is often UTC on cloud instances. Confirm that timezone before translating a local business time into a cron expression.',
    },
    {
      t: 'ul',
      items: [
        '**Set the timezone explicitly.** Vixie cron supports `CRON_TZ=Europe/London` at the top of a crontab, while some other implementations use `TZ=`.',
        '**Kubernetes CronJobs:** Kubernetes v1.27 and later support `.spec.timeZone`. Without it, scheduling follows the controller manager’s timezone.',
        '**Account for daylight-saving changes.** Depending on the cron implementation, a time in the transition window may be skipped or repeated. Use UTC or choose a time outside the local transition window for jobs that must run once.',
      ],
    },

    { t: 'h2', x: 'Six-field scheduler formats' },
    {
      t: 'p',
      x: 'Quartz and Spring’s `@Scheduled` syntax use six fields by adding **seconds** at the front. AWS EventBridge also uses six fields, but its final field is a **year**, and one of its day fields uses `?` instead of `*`.',
    },
    {
      t: 'code',
      lang: 'text',
      x: `Standard (5)      30 3 * * 1-5          03:30 on weekdays
Quartz (6)      0 30 3 ? * MON-FRI      leading seconds, ? for unused day field
EventBridge     30 3 ? * MON-FRI *      trailing year`,
    },
    { t: 'p', x: 'A valid expression for one scheduler may be invalid or mean something different in another. This tool validates the standard five-field format only.' },

    { t: 'h2', x: 'Making cron failures visible' },
    {
      t: 'code',
      lang: 'bash',
      x: `# Open the current user crontab
crontab -e

    # Display the current crontab
crontab -l

    # Send output to a log because cron mail is often unread
    # This keeps failures visible
30 3 * * 1-5 /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1

    # Escape percent signs in crontab commands
0 4 * * * /usr/bin/pg_dump db > /backups/db-$(date +\\%Y\\%m\\%d).sql`,
    },
    {
      t: 'ul',
      items: [
        '**Use absolute paths.** Cron often has a minimal `PATH`, such as `/usr/bin:/bin`. Use full paths for commands that may not be available there.',
        '**Load required environment explicitly.** Do not assume cron reads `.bashrc`, `.profile`, `nvm` configuration or a virtual environment.',
        '**Escape `%`.** A percent sign represents a newline in a crontab. An unescaped `date +%Y` can truncate the command.',
        '**End the file with a newline.** Some cron implementations ignore a final crontab line that has no newline.',
        '**Prevent overlapping runs.** If a job can exceed its interval, a lock such as `flock -n /tmp/job.lock` can stop another copy from starting.',
      ],
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Monitor successful runs',
      x: 'A deleted crontab, full disk or unavailable host can prevent a job without producing application output. Have important jobs report successful completion to monitoring, and alert when an expected report does not arrive.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'What does 30 3 * * 1-5 mean?',
          a: 'It runs at 03:30 every Monday through Friday in every month. `30` is the minute, `3` is the hour and `1-5` covers Monday through Friday in the day-of-week field.',
        },
        {
          q: 'Why has my cron job never run?',
          a: 'Check whether the command uses an unavailable relative path, the script is executable, the crontab ends with a newline, the server timezone matches the schedule and each `%` is escaped. Redirect standard output and standard error to a log while diagnosing the failure.',
        },
        {
          q: 'How do I run something every 30 seconds?',
          a: 'Standard cron has one-minute granularity. You can run once per minute and perform a second pass after a 30-second delay, or use a scheduler such as systemd timers that supports sub-minute intervals.',
        },
        {
          q: 'Is 0 the same as 7 for Sunday?',
          a: 'Many cron implementations accept both values for Sunday, but support for `7` is not universal. This tool accepts day-of-week values from `0` through `6`, with `0` for Sunday.',
        },
        {
          q: 'What happens to a job scheduled during a daylight-saving change?',
          a: 'Behavior varies by implementation. Vixie cron may compensate for a skipped spring-forward time and suppress a repeated autumn run, but other schedulers differ. For important jobs, use UTC or avoid the local transition window.',
        },
      ],
    },
  ],

  related: ['/tools/regex-tester/', '/guides/docker-container-exits-immediately/', '/tools/uuid-generator/'],
};
