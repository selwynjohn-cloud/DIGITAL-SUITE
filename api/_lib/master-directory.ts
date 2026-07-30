/** Central branch / client / staff master — same screen in every Management portal. */
export const MASTER_DIRECTORY_PATH = '/mis-admin'
export const MASTER_DIRECTORY_LABEL = 'Master Directory'
export const MASTER_DIRECTORY_ICON = '🗄'

/** Fleet / Recruitment management menu item. */
export const MASTER_DIRECTORY_MGMT_MENU_ITEM = {
  n: MASTER_DIRECTORY_LABEL,
  fn: 'openMasterDirectory',
  icon: MASTER_DIRECTORY_ICON,
} as const

/** Inline JS for server-rendered suite apps. */
export const OPEN_MASTER_DIRECTORY_JS = `function openMasterDirectory(){location.href='${MASTER_DIRECTORY_PATH}';}`

/** Sidebar help link — call showMasterDirectoryLink() after Management sign-in. */
export const MASTER_DIRECTORY_HELP_LINK_HTML = `<a href="${MASTER_DIRECTORY_PATH}" id="masterDirLink" style="display:none">${MASTER_DIRECTORY_ICON} ${MASTER_DIRECTORY_LABEL}</a>`

export const SHOW_MASTER_DIRECTORY_LINK_JS = `function showMasterDirectoryLink(isMgmt){var el=document.getElementById('masterDirLink');if(el)el.style.display=isMgmt?'block':'none';}`
