/**
 * Acting on reported pages in the Node version's database (logic in
 * server/node/takedown.ts):
 *
 *   docker compose exec framed node dist-node/takedown-cli.mjs reports
 *   docker compose exec framed node dist-node/takedown-cli.mjs hide <name>
 *   docker compose exec framed node dist-node/takedown-cli.mjs show <name>
 */
import { DEFAULT_DATABASE_PATH, openDatabase } from './database'
import { readSetting } from './settings'
import { recentReports, setHidden } from './takedown'

const USAGE = 'Use: takedown-cli.mjs reports | hide <name> | show <name>'
const [command, siteName] = process.argv.slice(2)
const db = openDatabase(readSetting('DATABASE_PATH') ?? DEFAULT_DATABASE_PATH)

if (command === 'reports') {
  const reports = recentReports(db)
  if (!reports.length) console.log('No reports.')
  for (const report of reports) {
    const state = report.isHidden ? ' (hidden)' : ''
    console.log(`${report.reportedAt}  /${report.siteName}${state}: ${report.reason}`)
  }
} else if ((command === 'hide' || command === 'show') && siteName) {
  if (!setHidden(db, siteName, command === 'hide')) {
    throw new Error(`There is no page called "${siteName}". Check the name with: takedown-cli.mjs reports`)
  }
  console.log(command === 'hide' ? `/${siteName} is hidden from visitors.` : `/${siteName} is visible again.`)
} else {
  throw new Error(USAGE)
}
