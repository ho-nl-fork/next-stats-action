const logger = require('../util/logger')
const releaseTypes = new Set(['release', 'published'])

module.exports = function actionInfo() {
  const {
    ISSUE_ID,
    SKIP_CLONE,
    GITHUB_REF,
    GIT_ROOT_DIR,
    GITHUB_ACTION,
    COMMENT_ENDPOINT,
    GITHUB_REPOSITORY,
    GITHUB_TOKEN,
    GITHUB_EVENT_PATH,
  } = process.env

  delete process.env.GITHUB_TOKEN
  // only use custom endpoint if we don't have a token
  const commentEndpoint = !GITHUB_TOKEN && COMMENT_ENDPOINT

  const info = {
    commentEndpoint,
    skipClone: SKIP_CLONE,
    actionName: GITHUB_ACTION,
    githubToken: GITHUB_TOKEN,
    customCommentEndpoint: !!commentEndpoint,
    gitRoot:
      GIT_ROOT_DIR ||
      `https://${GITHUB_TOKEN ? `${GITHUB_TOKEN}@` : ''}github.com/`,
    prRepo: GITHUB_REPOSITORY,
    prRef: GITHUB_REF,
    commitId: null,
    issueId: ISSUE_ID,
    isRelease: releaseTypes.has(GITHUB_ACTION),
  }

  // get comment
  if (GITHUB_EVENT_PATH) {
    const event = require(GITHUB_EVENT_PATH)
    info.actionName = event.action || info.actionName

    if (releaseTypes.has(info.actionName)) {
      info.isRelease = true
    } else {
      // Since GITHUB_REPOSITORY and REF might not match the fork
      // use event data to get repository and ref info
      const prData = event['pull_request']

      if (prData) {
        info.prRepo = prData.head.repo.full_name
        info.prRef = prData.head.ref
        info.issueId = prData.number

        if (!info.commentEndpoint) {
          info.commentEndpoint = prData._links.comments || ''
        }
        // comment endpoint might be under `href`
        if (typeof info.commentEndpoint === 'object') {
          info.commentEndpoint = info.commentEndpoint.href
        }
      }
    }
  }

  logger('Got actionInfo:')
  logger.json({
    ...info,
    githubToken: GITHUB_TOKEN ? 'found' : 'missing',
  })

  return info
}
