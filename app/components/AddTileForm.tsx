'use client'

import { useState, useEffect } from 'react'
import { TileData } from '../page'
import { Globe, FolderClosed, ImageIcon, Type, ChevronRight } from 'lucide-react'

interface AddTileFormProps {
  addTile: (newTile: Omit<TileData, 'id' | 'position'>) => void
  allowFolder?: boolean
}

const PRESET_COLORS = [
  '#ffffff', '#f1f5f9', '#1e293b', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#3b82f6',
  '#8b5cf6', '#ec4899',
]

const FOLDER_DEFAULT_BG = '#2563eb'

export default function AddTileForm({ addTile, allowFolder = true }: AddTileFormProps) {
  const [availableIcons, setAvailableIcons] = useState<string[]>([])
  const [tileType, setTileType] = useState<'link' | 'folder'>('link')

  const [link, setLink] = useState({
    url: '',
    icon: '',
    backgroundColor: '#ffffff',
    text: '',
    displayMode: 'text' as 'icon' | 'text',
  })

  const [folder, setFolder] = useState({
    folderName: '',
    backgroundColor: FOLDER_DEFAULT_BG,
  })

  useEffect(() => {
    fetch('/api/icons')
      .then(res => res.json())
      .then(data => setAvailableIcons(data.icons))
      .catch(() => {})
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (tileType === 'folder') {
      if (!folder.folderName.trim()) return
      addTile({
        type: 'folder',
        url: '',
        icon: '',
        text: '',
        displayMode: 'icon',
        backgroundColor: folder.backgroundColor,
        folderName: folder.folderName.trim(),
        folderTiles: [],
      })
      setFolder({ folderName: '', backgroundColor: FOLDER_DEFAULT_BG })
    } else {
      if (!link.url.trim()) return
      addTile({
        type: 'link',
        url: link.url,
        icon: link.icon,
        backgroundColor: link.backgroundColor,
        text: link.text,
        displayMode: link.displayMode,
      })
      setLink({ url: '', icon: '', backgroundColor: '#ffffff', text: '', displayMode: 'icon' })
    }
  }

  const bgColor = tileType === 'folder' ? folder.backgroundColor : link.backgroundColor
  const setBgColor = (c: string) =>
    tileType === 'folder'
      ? setFolder(f => ({ ...f, backgroundColor: c }))
      : setLink(l => ({ ...l, backgroundColor: c }))

  return (
    <form onSubmit={handleSubmit} className="px-6 pb-6 pt-2 space-y-5">

      {/* ── Heading ── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 leading-tight">New Tile</h2>
        <p className="text-sm text-gray-400 mt-0.5">Add a link or a folder to your launchpad</p>
      </div>

      {/* ── Type selector ── */}
      <div className="flex gap-3">
        {(allowFolder ? (['link', 'folder'] as const) : (['link'] as const)).map(type => {
          const active = tileType === type
          return (
            <button
              key={type}
              type="button"
              onClick={() => setTileType(type)}
              className={`flex-1 flex flex-col items-center gap-2.5 py-4 px-3 rounded-2xl border-2 transition-all duration-200
                ${active
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-gray-100'
                }`}
            >
              {type === 'link' ? (
                <Globe className={`w-6 h-6 transition-colors ${active ? 'text-blue-500' : 'text-gray-400'}`} />
              ) : (
                <FolderClosed className={`w-6 h-6 transition-colors ${active ? 'text-blue-500' : 'text-gray-400'}`} />
              )}
              <span className={`text-sm font-medium capitalize transition-colors ${active ? 'text-blue-600' : 'text-gray-500'}`}>
                {type}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-gray-100" />

      {/* ── Link fields ── */}
      {tileType === 'link' && (
        <div className="space-y-4">
          {/* URL */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">URL</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
              <input
                type="url"
                value={link.url}
                onChange={e => setLink(l => ({ ...l, url: e.target.value }))}
                placeholder="https://example.com"
                required
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white
                  placeholder-gray-300 text-gray-900
                  focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400
                  transition-all duration-150"
              />
            </div>
          </div>

          {/* Display mode segmented control */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Display</label>
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setLink(l => ({ ...l, displayMode: 'icon' }))}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${link.displayMode === 'icon' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Icon
              </button>
              <button
                type="button"
                onClick={() => setLink(l => ({ ...l, displayMode: 'text' }))}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${link.displayMode === 'text' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Type className="w-3.5 h-3.5" />
                Text
              </button>
            </div>
          </div>

          {/* Icon / text field */}
          {link.displayMode === 'icon' ? (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Icon URL</label>
              <input
                list="icons-list"
                type="text"
                value={link.icon}
                onChange={e => setLink(l => ({ ...l, icon: e.target.value }))}
                placeholder="/icons/example.png"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white
                  placeholder-gray-300 text-gray-900
                  focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400
                  transition-all duration-150"
              />
              <datalist id="icons-list">
                {availableIcons.map(icon => (
                  <option key={icon} value={`/icons/${icon}`} />
                ))}
              </datalist>
              {link.icon && (
                <div
                  className="mt-2.5 h-20 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: link.backgroundColor }}
                >
                  <img
                    src={link.icon}
                    alt="Preview"
                    className="h-12 w-12 object-contain"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Text</label>
              <input
                type="text"
                value={link.text}
                onChange={e => setLink(l => ({ ...l, text: e.target.value }))}
                placeholder="Hello"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white
                  placeholder-gray-300 text-gray-900
                  focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400
                  transition-all duration-150"
              />
              {link.text && (
                <div
                  className="mt-2.5 h-20 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: link.backgroundColor }}
                >
                  <span className="text-2xl font-bold text-center break-words leading-tight px-2">
                    {link.text}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Folder fields ── */}
      {tileType === 'folder' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Folder Name</label>
            <input
              type="text"
              value={folder.folderName}
              onChange={e => setFolder(f => ({ ...f, folderName: e.target.value }))}
              placeholder="My Folder"
              required
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white
                placeholder-gray-300 text-gray-900
                focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400
                transition-all duration-150"
            />
          </div>
        </div>
      )}

      {/* ── Color swatches ── */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Background</label>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setBgColor(color)}
              className={`w-7 h-7 rounded-full transition-all duration-150 flex-shrink-0
                ${bgColor === color
                  ? 'scale-125 ring-2 ring-offset-2 ring-blue-400'
                  : 'hover:scale-110'}`}
              style={{
                backgroundColor: color,
                boxShadow: color === '#ffffff' ? 'inset 0 0 0 1px #e5e7eb' : undefined,
              }}
              title={color}
            />
          ))}
          {/* Custom color */}
          <label
            className="w-7 h-7 rounded-full overflow-hidden cursor-pointer hover:scale-110 transition-transform duration-150 flex-shrink-0"
            style={{
              background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
              boxShadow: bgColor && !PRESET_COLORS.includes(bgColor) ? '0 0 0 2px #fff, 0 0 0 4px #3b82f6' : undefined,
            }}
            title="Custom color"
          >
            <input
              type="color"
              value={bgColor}
              onChange={e => setBgColor(e.target.value)}
              className="opacity-0 w-full h-full cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* ── Submit ── */}
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl
          bg-gray-900 hover:bg-gray-800 active:bg-gray-950
          text-white text-sm font-semibold
          transition-all duration-150 shadow-sm hover:shadow-md"
      >
        {tileType === 'folder' ? 'Create Folder' : 'Add Tile'}
        <ChevronRight className="w-4 h-4" />
      </button>
    </form>
  )
}
