'use client'

import { useState, useEffect } from 'react'
import { TileData } from '../page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AddTileFormProps {
  addTile: (newTile: Omit<TileData, 'id' | 'position'>) => void
}

export default function AddTileForm({ addTile }: AddTileFormProps) {
  const [availableIcons, setAvailableIcons] = useState<string[]>([])
  const [newTile, setNewTile] = useState<Omit<TileData, 'id' | 'position'>>({
    url: '',
    icon: '',
    backgroundColor: '#ffffff',
    text: '',
    displayMode: 'icon'
  })

  useEffect(() => {
    fetch('/api/icons')
      .then(res => res.json())
      .then(data => setAvailableIcons(data.icons))
      .catch(err => console.error('Error loading icons:', err))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTile.url) {
      addTile(newTile)
      setNewTile({ url: '', icon: '', backgroundColor: '#ffffff', text: '', displayMode: 'icon' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 p-6">
      <Input
        type="url"
        value={newTile.url}
        onChange={(e) => setNewTile({ ...newTile, url: e.target.value })}
        placeholder="URL"
        className="mb-4"
        required
      />
      
      <div className="mb-4">
        <label className="block text-sm text-gray-500 mb-2">Display Mode:</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="displayMode"
              value="icon"
              checked={newTile.displayMode === 'icon'}
              onChange={(e) => setNewTile({ ...newTile, displayMode: 'icon' })}
              className="mr-2"
            />
            Icon
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="displayMode"
              value="text"
              checked={newTile.displayMode === 'text'}
              onChange={(e) => setNewTile({ ...newTile, displayMode: 'text' })}
              className="mr-2"
            />
            Text
          </label>
        </div>
      </div>

      {newTile.displayMode === 'icon' ? (
        <>
          <div className="mb-4">
            <Input
              list="icons"
              type="text"
              value={newTile.icon}
              onChange={(e) => setNewTile({ ...newTile, icon: e.target.value })}
              placeholder="Select or type icon path"
              className="mb-2"
            />
            <datalist id="icons">
              {availableIcons.map((icon) => (
                <option key={icon} value={`/icons/${icon}`} />
              ))}
            </datalist>
          </div>
          {newTile.icon && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">Preview:</p>
              <div 
                className="w-full h-[200px] rounded-lg flex items-center justify-center"
                style={{ backgroundColor: newTile.backgroundColor }}
              >
                <img
                  src={newTile.icon}
                  alt="Icon preview"
                  className="w-20 h-20 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <Input
            type="text"
            value={newTile.text || ''}
            onChange={(e) => setNewTile({ ...newTile, text: e.target.value })}
            placeholder="Display Text"
            className="mb-4"
            required
          />
          {newTile.text && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">Preview:</p>
              <div 
                className="w-full h-[200px] rounded-lg flex items-center justify-center"
                style={{ backgroundColor: newTile.backgroundColor }}
              >
                <span className="text-3xl font-bold text-center px-4 break-words leading-tight">
                  {newTile.text}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      <div className="mb-6">
        <label className="block text-sm text-gray-500 mb-1">Background Color:</label>
        <Input
          type="color"
          value={newTile.backgroundColor}
          onChange={(e) => setNewTile({ ...newTile, backgroundColor: e.target.value })}
          className="w-full h-10"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit">Add Tile</Button>
      </div>
    </form>
  )
}

