// ZenApp Design System — Tailwind class tokens
// Single source of truth for all reusable UI patterns

// Layout
export const PAGE_CONTAINER = 'flex-1 bg-slate-50 min-h-screen'
export const PAGE_CONTENT = 'max-w-[1400px] mx-auto px-6 py-6'
export const PAGE_HEADER = 'flex items-center justify-between mb-6'
export const PAGE_TITLE = 'text-2xl font-semibold text-slate-900'
export const PAGE_SUBTITLE = 'text-sm text-slate-500 mt-1'

// Cards
export const CARD = 'bg-white border border-slate-200 rounded-xl shadow-sm'
export const CARD_PADDING = 'p-6'
export const CARD_SM_PADDING = 'p-4'
export const CARD_HEADER = 'flex items-center justify-between mb-4'
export const CARD_TITLE = 'text-base font-semibold text-slate-900'

// Buttons
export const BTN_PRIMARY = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer border-none'
export const BTN_SECONDARY = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer'
export const BTN_GHOST = 'inline-flex items-center justify-center gap-2 px-3 py-2 text-slate-500 text-sm font-medium rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer bg-transparent border-none'
export const BTN_DANGER = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors cursor-pointer border-none'
export const BTN_SUCCESS = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer border-none'
export const BTN_ICON = 'inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer bg-transparent border-none'

// Inputs
export const INPUT = 'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors'
export const TEXTAREA = 'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-y min-h-[80px]'
export const LABEL = 'block text-sm font-medium text-slate-700 mb-1.5'
export const SELECT = 'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors appearance-none cursor-pointer'
export const CHECKBOX = 'w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500'

// Tables
export const TABLE_WRAPPER = 'overflow-x-auto'
export const TABLE = 'w-full text-sm'
export const TABLE_HEAD = 'bg-slate-50 text-left'
export const TABLE_TH = 'px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider'
export const TABLE_TD = 'px-4 py-3.5 text-slate-700 border-b border-slate-100'
export const TABLE_ROW = 'hover:bg-slate-50/80 transition-colors'
export const TABLE_ROW_STRIPED = 'even:bg-slate-50/50'

// Badges
export const BADGE = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
export const BADGE_DEFAULT = `${BADGE} bg-slate-100 text-slate-700`
export const BADGE_PRIMARY = `${BADGE} bg-indigo-50 text-indigo-700`
export const BADGE_SUCCESS = `${BADGE} bg-emerald-50 text-emerald-700`
export const BADGE_WARNING = `${BADGE} bg-amber-50 text-amber-700`
export const BADGE_DANGER = `${BADGE} bg-red-50 text-red-700`
export const BADGE_INFO = `${BADGE} bg-sky-50 text-sky-700`

// Tabs
export const TAB_CONTAINER = 'flex items-center gap-1 border-b border-slate-200 mb-6'
export const TAB_ITEM = 'px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 border-b-2 border-transparent transition-colors cursor-pointer bg-transparent'
export const TAB_ACTIVE = 'px-4 py-2.5 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 cursor-pointer bg-transparent'

// Avatar
export const AVATAR_SM = 'w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold'
export const AVATAR_MD = 'w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold'
export const AVATAR_LG = 'w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-base font-semibold'

// Empty states
export const EMPTY_STATE = 'flex flex-col items-center justify-center py-16 text-center'
export const EMPTY_ICON = 'w-16 h-16 text-slate-300 mb-4'
export const EMPTY_TITLE = 'text-lg font-medium text-slate-500 mb-1'
export const EMPTY_DESC = 'text-sm text-slate-400 max-w-sm'

// Modal
export const MODAL_OVERLAY = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'
export const MODAL_CARD = 'bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-auto'
export const MODAL_HEADER = 'flex items-center justify-between p-6 border-b border-slate-200'
export const MODAL_BODY = 'p-6'
export const MODAL_FOOTER = 'flex items-center justify-end gap-3 p-6 border-t border-slate-200'

// Stat cards
export const STAT_CARD = `${CARD} ${CARD_PADDING}`
export const STAT_VALUE = 'text-2xl font-bold text-slate-900'
export const STAT_LABEL = 'text-sm text-slate-500 mt-1'

// Search
export const SEARCH_INPUT = 'w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-colors'

// Dividers
export const DIVIDER = 'border-t border-slate-200 my-6'

// Section headings
export const SECTION_TITLE = 'text-lg font-semibold text-slate-800 mb-4'
export const SECTION_SUBTITLE = 'text-sm font-medium text-slate-500 uppercase tracking-wider mb-3'

// Filter pills
export const FILTER_PILL = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-colors'
export const FILTER_PILL_ACTIVE = `${FILTER_PILL} bg-indigo-50 text-indigo-700 border-indigo-200`
export const FILTER_PILL_INACTIVE = `${FILTER_PILL} bg-white text-slate-600 border-slate-200 hover:bg-slate-50`

// Back button
export const BACK_BUTTON = 'inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors cursor-pointer bg-transparent border-none mb-4'
