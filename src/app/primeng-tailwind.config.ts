export const PRIME_NG_TAILWIND = {
  table: {
    root: { class: 'w-full text-xs' },
    header: { class: 'bg-slate-100 text-slate-700' },
    headerCell: {
      class: 'px-2 py-1 whitespace-nowrap border-b border-slate-300',
    },
    bodyRow: { class: 'hover:bg-slate-50' },
    bodyCell: {
      class: 'px-2 py-1 whitespace-nowrap border-b border-slate-200',
    },
    footer: { class: 'text-xs' },
  },

  inputtext: {
    root: { class: 'border border-slate-300 rounded px-2 py-1 text-xs h-7' },
  },

  dropdown: {
    root: { class: 'text-xs h-7' },
    panel: {
      class:
        'bg-white border border-slate-300 rounded shadow-md text-xs z-[9999]',
    },
    item: { class: 'px-2 py-1 hover:bg-slate-100 cursor-pointer text-xs' },
  },

  multiselect: {
    root: { class: 'text-xs h-7 min-h-7' },
    label: { class: 'text-xs' },
    panel: {
      class:
        'bg-white border border-slate-300 rounded shadow-md text-xs z-[9999]',
    },
    item: { class: 'px-2 py-1 hover:bg-slate-100 cursor-pointer text-xs' },
    token: { class: 'bg-slate-200 text-slate-700 px-1 py-0.5 text-xs rounded' },
  },

  paginator: {
    root: {
      class:
        'flex items-center justify-end px-2 py-1 text-xs border-t border-slate-200',
    },
    pageButton: { class: 'px-2 py-1 rounded hover:bg-slate-200 text-xs' },
    currentPageButton: { class: 'bg-slate-700 text-white' },
  },

  columnfilter: {
    container: { class: 'flex flex-col gap-1' },
  },
};
