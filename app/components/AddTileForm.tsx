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
    backgroundColor: '#ffffff'
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
      setNewTile({ url: '', icon: '', backgroundColor: '#ffffff' })
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
      <div className="mb-6">
        <label className="block text-sm text-gray-500 mb-1">Background Color:</label>
        <Input
          type="color"
          value={newTile.backgroundColor}
          onChange={(e) => setNewTile({ ...newTile, backgroundColor: e.target.value })}
          className="w-full h-10"
        />
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
      <div className="flex justify-end gap-2">
        <Button type="submit">Add Tile</Button>
      </div>
    </form>
  )
}

